'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/PendingMaterialsController.js
|--------------------------------------------------------------------------
|
| Solicitações de materiais não cadastrados (Fase 2, migrado do Supabase).
| Réplica fiel de src/lib/pending.functions.ts.
|
*/

const { DateTime } = require('luxon')
const Database = use('Adonis/Lucid/Database')
const PendingMaterial = require('../../Models/PendingMaterial')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const UnitRules = require('../../Services/UnitRules')
const CreatePendingMaterial = require('../../Validators/CreatePendingMaterial')

function toDateOnly(v) {
  if (!v) return null
  return DateTime.isDateTime(v) ? v.toISODate() : String(v)
}

class PendingMaterialsController {
  // POST /pending-materials (técnico — cookie)
  async store(ctx) {
    const { request, response, technician } = ctx
    const data = await request.validate(CreatePendingMaterial)

    const qErr = UnitRules.validateQuantity(data.quantity, data.unit)
    if (qErr) return response.status(422).json({ message: qErr })

    const row = await PendingMaterial.create({
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      destination: data.destination,
      category_hint: data.category_hint || null,
      usage_date: toDateOnly(data.usage_date),
      notes: data.notes || null,
      requested_by_technician: technician.id,
    })

    await AuditLogger.log(ctx, {
      action: 'PENDING_CREATE',
      entityType: 'pending_material',
      entityId: row.id,
      details: { description: data.description, quantity: data.quantity, unit: data.unit, destination: data.destination },
    })

    return response.status(201).json({ ok: true, id: row.id })
  }

  // GET /pending-materials/mine (técnico — cookie)
  async mine({ technician }) {
    const rows = await PendingMaterial.query()
      .where('requested_by_technician', technician.id)
      .orderBy('created_at', 'desc')
      .limit(30)
    return rows.map((r) => ({
      id: r.id, description: r.description, quantity: Number(r.quantity), unit: r.unit,
      status: r.status, resolution_notes: r.resolution_notes, destination: r.destination,
      category_hint: r.category_hint, usage_date: r.usage_date, created_at: r.created_at,
    }))
  }

  // GET /pending-materials (PCM)
  async index(ctx) {
    assertRole(ctx, ['admin'])
    const { request } = ctx
    const { status = 'pendente' } = request.qs()

    const query = PendingMaterial.query()
      .preload('technician')
      .orderBy('created_at', 'desc')
      .limit(200)
    if (status !== 'todos') query.where('status', status)

    const rows = await query
    return rows.map((r) => ({
      id: r.id, description: r.description, quantity: Number(r.quantity), unit: r.unit,
      status: r.status, notes: r.notes, resolution_notes: r.resolution_notes, created_at: r.created_at,
      destination: r.destination ?? null, category_hint: r.category_hint ?? null, usage_date: r.usage_date ?? null,
      technician_name: r.technician?.name ?? '—',
    }))
  }

  // POST /pending-materials/:id/approve (PCM)
  async approve(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const data = request.only(['code', 'name', 'category_id', 'unit', 'initial_quantity', 'unit_value', 'notes'])

    if (Number(data.initial_quantity) > 0) {
      const qErr = UnitRules.validateQuantity(data.initial_quantity, data.unit)
      if (qErr) return response.status(422).json({ message: qErr })
    }

    const pending = await PendingMaterial.find(params.id)
    if (!pending) return response.status(404).json({ message: 'Solicitação não encontrada.' })
    if (pending.status !== 'pendente') return response.status(422).json({ message: 'Solicitação já tratada.' })

    const requestedQty = Number(pending.quantity)
    const initialQuantity = Number(data.initial_quantity)
    if (initialQuantity < requestedQty) {
      return response.status(422).json({
        message: `Estoque inicial (${initialQuantity}) deve ser ≥ à quantidade solicitada (${requestedQty}) para conclusão automática da retirada.`,
      })
    }

    const dup = await Material.query().where('code', data.code).first()
    if (dup) return response.status(422).json({ message: 'Código de material já existe.' })

    const trx = await Database.transaction()
    try {
      const material = await Material.create(
        {
          code: data.code, name: data.name, category_id: data.category_id, unit: data.unit,
          quantity: initialQuantity, unit_value: data.unit_value, notes: data.notes || null,
          status: 'ativo', created_by: user.id, updated_by: user.id,
        },
        { client: trx }
      )

      if (initialQuantity > 0) {
        await StockMovement.create(
          {
            material_id: material.id, type: 'inventario_inicial',
            quantity: initialQuantity, unit_value_snapshot: data.unit_value,
            total_value: initialQuantity * data.unit_value,
            performed_by_user: user.id, reason: 'Cadastro via aprovação de solicitação',
          },
          { client: trx }
        )
      }

      let finalStatus = 'aprovado'
      if (requestedQty > 0 && pending.requested_by_technician) {
        const remaining = initialQuantity - requestedQty
        material.useTransaction(trx)
        material.quantity = remaining
        await material.save()

        await StockMovement.create(
          {
            material_id: material.id, type: 'retirada',
            quantity: requestedQty, unit_value_snapshot: data.unit_value,
            total_value: requestedQty * data.unit_value,
            technician_id: pending.requested_by_technician,
            notes: `Retirada automática — solicitação aprovada. Destino: ${pending.destination ?? '—'}`,
          },
          { client: trx }
        )
        finalStatus = 'concluido'
      }

      pending.useTransaction(trx)
      pending.status = finalStatus
      pending.resolved_by_user = user.id
      pending.resolved_material_id = material.id
      await pending.save()

      await trx.commit()

      await AuditLogger.log(ctx, {
        action: 'PENDING_APPROVE',
        entityType: 'pending_material',
        entityId: pending.id,
        details: { material_id: material.id, code: data.code, name: data.name, initial_quantity: initialQuantity, auto_withdrawal: requestedQty, final_status: finalStatus },
      })

      return { ok: true, material_id: material.id, status: finalStatus }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // POST /pending-materials/:id/reject (PCM)
  async reject(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const { reason } = request.only(['reason'])
    if (!reason || String(reason).trim().length < 2) {
      return response.status(422).json({ message: 'Informe um motivo.' })
    }

    const pending = await PendingMaterial.find(params.id)
    if (!pending) return response.status(404).json({ message: 'Solicitação não encontrada.' })
    if (pending.status !== 'pendente') return response.status(422).json({ message: 'Solicitação já tratada.' })

    pending.status = 'rejeitado'
    pending.resolved_by_user = user.id
    pending.resolution_notes = reason
    await pending.save()

    await AuditLogger.log(ctx, {
      action: 'PENDING_REJECT',
      entityType: 'pending_material',
      entityId: pending.id,
      details: { reason },
    })
    return { ok: true }
  }
}

module.exports = PendingMaterialsController
