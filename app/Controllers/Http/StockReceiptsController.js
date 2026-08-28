'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/StockReceiptsController.js
|--------------------------------------------------------------------------
|
| Recebimento de materiais + inventário inicial + timeline + histórico de
| fornecedor (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/receipts.functions.ts.
|
*/

const { DateTime } = require('luxon')
const Database = use('Adonis/Lucid/Database')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const StockReceipt = require('../../Models/StockReceipt')
const Supplier = require('../../Models/Supplier')
const SystemSetting = require('../../Models/SystemSetting')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const UnitRules = require('../../Services/UnitRules')
const CreateReceipt = require('../../Validators/CreateReceipt')
const RegisterInitialInventoryEntry = require('../../Validators/RegisterInitialInventoryEntry')

const INVENTORY_KEY = 'initial_inventory'

async function getSetting(key) {
  return SystemSetting.find(key)
}

async function putSetting(key, value, userId) {
  let row = await SystemSetting.find(key)
  if (!row) {
    row = new SystemSetting()
    row.key = key
  }
  row.value = value
  row.updated_by = userId
  await row.save()
  return row
}

function toIso(v) {
  if (!v) return null
  return DateTime.isDateTime(v) ? v.toISO() : String(v)
}

class StockReceiptsController {
  // ---- Inventário inicial: status / finalize / reopen -------------------

  // GET /inventory/status
  async getInventoryStatus(ctx) {
    assertRole(ctx, ['admin'])
    const row = await getSetting(INVENTORY_KEY)
    const v = row?.value ?? { finalized: false }
    return {
      finalized: !!v.finalized,
      finalized_at: v.finalized_at ?? null,
      finalized_by: v.finalized_by ?? null,
    }
  }

  // POST /inventory/finalize
  async finalizeInventory(ctx) {
    assertRole(ctx, ['admin'])
    const { user } = ctx
    const now = new Date().toISOString()
    await putSetting(INVENTORY_KEY, { finalized: true, finalized_at: now, finalized_by: user.id }, user.id)
    await AuditLogger.log(ctx, { action: 'INITIAL_INVENTORY_FINALIZED', details: { at: now } })
    return { ok: true }
  }

  // POST /inventory/reopen
  async reopenInventory(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const { reason } = request.only(['reason'])
    if (!reason || String(reason).trim().length < 10) {
      return response.status(422).json({ message: 'Informe uma justificativa com pelo menos 10 caracteres.' })
    }
    await putSetting(INVENTORY_KEY, { finalized: false, reopened_at: new Date().toISOString() }, user.id)
    await AuditLogger.log(ctx, { action: 'INITIAL_INVENTORY_REOPENED', details: { reason } })
    return { ok: true }
  }

  // POST /inventory/entries — lançamento manual de inventário inicial
  async registerInitialEntry(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const data = await request.validate(RegisterInitialInventoryEntry)

    const setting = await getSetting(INVENTORY_KEY)
    if (setting?.value?.finalized) {
      return response.status(422).json({ message: 'Inventário inicial já finalizado. Utilize Recebimento ou Ajuste de Estoque.' })
    }

    const material = await Material.find(data.material_id)
    if (!material) return response.status(404).json({ message: 'Material não encontrado.' })

    const qErr = UnitRules.validateQuantity(data.quantity, material.unit)
    if (qErr) return response.status(422).json({ message: qErr })

    const trx = await Database.transaction()
    try {
      const current = Number(material.quantity)
      material.useTransaction(trx)
      material.quantity = current + data.quantity
      material.unit_value = data.unit_value
      material.updated_by = user.id
      await material.save()

      await StockMovement.create(
        {
          material_id: material.id, type: 'inventario_inicial',
          quantity: data.quantity, unit_value_snapshot: data.unit_value,
          total_value: data.quantity * data.unit_value,
          performed_by_user: user.id, reason: 'Inventário inicial', justification: data.observation,
        },
        { client: trx }
      )

      await trx.commit()

      await AuditLogger.log(ctx, {
        action: 'INITIAL_INVENTORY_ENTRY', entityType: 'material', entityId: material.id,
        details: { quantity: data.quantity, unit_value: data.unit_value, observation: data.observation },
      })
      return { ok: true }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // ---- Recebimentos -------------------------------------------------------

  // POST /receipts
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { response, user } = ctx
    const data = await ctx.request.validate(CreateReceipt)

    const supplier = await Supplier.find(data.supplier_id)
    if (!supplier) return response.status(404).json({ message: 'Fornecedor não encontrado.' })
    if (supplier.status !== 'ativo') return response.status(422).json({ message: 'Fornecedor inativo.' })

    const ids = Array.from(new Set(data.items.map((i) => i.material_id)))
    const mats = await Material.query().whereIn('id', ids)
    const byId = new Map(mats.map((m) => [m.id, m]))
    if (byId.size !== ids.length) return response.status(422).json({ message: 'Material inválido no recebimento.' })

    for (const it of data.items) {
      const m = byId.get(it.material_id)
      const qErr = UnitRules.validateQuantity(it.quantity, m.unit)
      if (qErr) return response.status(422).json({ message: `${m.code} — ${qErr}` })
      if (m.status !== 'ativo') return response.status(422).json({ message: `${m.code} — material inativo.` })
    }

    const itemsCount = data.items.length
    const totalValue = data.items.reduce((s, i) => s + i.quantity * i.unit_value, 0)
    const receivedAt = data.received_at ? (DateTime.isDateTime(data.received_at) ? data.received_at : DateTime.fromJSDate(new Date(data.received_at))) : DateTime.local()

    const trx = await Database.transaction()
    try {
      const receipt = await StockReceipt.create(
        {
          supplier_id: data.supplier_id,
          nf_number: data.nf_number.trim(),
          oc_number: data.oc_number?.trim() || null,
          received_at: receivedAt,
          received_by: user.id,
          notes: data.notes?.trim() || null,
          items_count: itemsCount,
          total_value: totalValue,
        },
        { client: trx }
      )

      for (const it of data.items) {
        const m = byId.get(it.material_id)
        const current = Number(m.quantity)
        m.useTransaction(trx)
        m.quantity = current + it.quantity
        m.unit_value = it.unit_value
        m.updated_by = user.id
        await m.save()

        await StockMovement.create(
          {
            material_id: m.id, type: 'recebimento',
            quantity: it.quantity, unit_value_snapshot: it.unit_value,
            total_value: it.quantity * it.unit_value,
            performed_by_user: user.id,
            supplier_id: data.supplier_id,
            nf_number: data.nf_number.trim(),
            oc_number: data.oc_number?.trim() || null,
            receipt_id: receipt.id,
            reason: 'Recebimento de material',
            notes: it.observation?.trim() || null,
          },
          { client: trx }
        )
      }

      await trx.commit()

      await AuditLogger.log(ctx, {
        action: 'RECEIPT_CREATE', entityType: 'receipt', entityId: receipt.id,
        details: { supplier_id: data.supplier_id, nf: data.nf_number, oc: data.oc_number ?? null, items: itemsCount, total_value: totalValue },
      })

      return response.status(201).json({ id: receipt.id, items: itemsCount, total: totalValue })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // GET /receipts
  async index(ctx) {
    assertRole(ctx, ['admin'])
    const { request } = ctx
    const { supplier_id, nf, oc, from, to } = request.qs()

    const query = StockReceipt.query().preload('supplier').orderBy('received_at', 'desc').limit(500)
    if (supplier_id) query.where('supplier_id', supplier_id)
    if (nf) query.whereRaw('lower(nf_number) like ?', [`%${String(nf).toLowerCase()}%`])
    if (oc) query.whereRaw('lower(oc_number) like ?', [`%${String(oc).toLowerCase()}%`])
    if (from) query.where('received_at', '>=', from)
    if (to) query.where('received_at', '<=', `${to} 23:59:59`)

    const rows = await query
    return rows.map((r) => ({
      id: r.id, supplier_id: r.supplier_id,
      supplier_name: r.supplier?.razao_social ?? null,
      supplier_cnpj: r.supplier?.cnpj ?? null,
      nf_number: r.nf_number, oc_number: r.oc_number,
      received_at: toIso(r.received_at), notes: r.notes,
      items_count: r.items_count, total_value: Number(r.total_value),
    }))
  }

  // GET /receipts/:id
  async show(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const header = await StockReceipt.query().where('id', params.id).preload('supplier').first()
    if (!header) return response.status(404).json({ message: 'Recebimento não encontrado.' })

    const items = await StockMovement.query()
      .where('receipt_id', params.id)
      .preload('material')
      .orderBy('created_at', 'asc')

    return {
      id: header.id, supplier_id: header.supplier_id,
      nf_number: header.nf_number, oc_number: header.oc_number,
      received_at: toIso(header.received_at), received_by: header.received_by, notes: header.notes,
      items_count: header.items_count, total_value: Number(header.total_value),
      supplier_name: header.supplier?.razao_social ?? null,
      supplier_cnpj: header.supplier?.cnpj ?? null,
      items: items.map((i) => ({
        id: i.id, material_id: i.material_id,
        code: i.material?.code, name: i.material?.name, unit: i.material?.unit,
        quantity: Number(i.quantity), unit_value: Number(i.unit_value_snapshot), total_value: Number(i.total_value),
        observation: i.notes,
      })),
    }
  }

  // GET /materials/:id/timeline
  async materialTimeline(ctx) {
    assertRole(ctx, ['admin'])
    const { params } = ctx
    const rows = await StockMovement.query()
      .where('material_id', params.id)
      .preload('supplier')
      .preload('technician')
      .preload('performedByUser')
      .orderBy('created_at', 'desc')
      .limit(500)

    return rows.map((r) => ({
      id: r.id, created_at: toIso(r.created_at), type: r.type,
      quantity: Number(r.quantity), unit_value: Number(r.unit_value_snapshot), total_value: Number(r.total_value),
      reason: r.reason, notes: r.notes, justification: r.justification,
      nf_number: r.nf_number, oc_number: r.oc_number, receipt_id: r.receipt_id,
      supplier_name: r.supplier?.razao_social ?? null,
      technician_name: r.technician?.name ?? null,
      user_name: r.performedByUser?.full_name ?? r.performedByUser?.email ?? null,
    }))
  }

  // GET /suppliers/:id/history
  async supplierHistory(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const supplier = await Supplier.find(params.id)
    if (!supplier) return response.status(404).json({ message: 'Fornecedor não encontrado.' })

    const receipts = await StockReceipt.query().where('supplier_id', params.id).orderBy('received_at', 'desc')
    const totalValue = receipts.reduce((s, r) => s + Number(r.total_value), 0)
    const lastAt = receipts[0] ? toIso(receipts[0].received_at) : null
    const nfs = Array.from(new Set(receipts.map((r) => r.nf_number).filter(Boolean)))
    const ocs = Array.from(new Set(receipts.map((r) => r.oc_number).filter(Boolean)))

    const mvs = await StockMovement.query()
      .where('supplier_id', params.id)
      .whereIn('type', ['recebimento', 'ajuste_entrada'])
      .preload('material')

    const byMat = new Map()
    for (const m of mvs) {
      const cur = byMat.get(m.material_id) ?? { code: m.material?.code, name: m.material?.name, unit: m.material?.unit, qty: 0, value: 0 }
      cur.qty += Number(m.quantity)
      cur.value += Number(m.total_value)
      byMat.set(m.material_id, cur)
    }
    const materials = Array.from(byMat.values()).sort((a, b) => b.value - a.value)

    return {
      supplier: { id: supplier.id, razao_social: supplier.razao_social, cnpj: supplier.cnpj, status: supplier.status },
      deliveries_count: receipts.length,
      total_value: totalValue,
      last_delivery_at: lastAt,
      nf_numbers: nfs,
      oc_numbers: ocs,
      materials,
      receipts: receipts.map((r) => ({
        id: r.id, received_at: toIso(r.received_at), nf_number: r.nf_number, oc_number: r.oc_number,
        items_count: r.items_count, total_value: Number(r.total_value),
      })),
    }
  }
}

module.exports = StockReceiptsController
