'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/SuppliersController.js
|--------------------------------------------------------------------------
|
| Fornecedores (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/suppliers.functions.ts, incluindo validação de CNPJ.
|
*/

const Supplier = require('../../Models/Supplier')
const StockMovement = require('../../Models/StockMovement')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreateSupplier = require('../../Validators/CreateSupplier')
const UpdateSupplier = require('../../Validators/UpdateSupplier')

function onlyDigits(v) {
  return String(v).replace(/\D+/g, '')
}

function isValidCnpj(cnpj) {
  const s = onlyDigits(cnpj)
  if (s.length !== 14) return false
  if (/^(\d)\1+$/.test(s)) return false
  const calc = (base, factors) => factors.reduce((acc, f, i) => acc + parseInt(base[i], 10) * f, 0)
  const f1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const f2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = calc(s.substring(0, 12), f1) % 11 < 2 ? 0 : 11 - (calc(s.substring(0, 12), f1) % 11)
  const d2 = calc(s.substring(0, 13), f2) % 11 < 2 ? 0 : 11 - (calc(s.substring(0, 13), f2) % 11)
  return d1 === parseInt(s[12], 10) && d2 === parseInt(s[13], 10)
}

class SuppliersController {
  // GET /suppliers
  async index(ctx) {
    assertRole(ctx, ['admin'])
    return Supplier.query().orderBy('razao_social', 'asc')
  }

  // GET /suppliers/select — lista simples (ativos) para selects
  async forSelect(ctx) {
    assertRole(ctx, ['admin'])
    return Supplier.query()
      .where('status', 'ativo')
      .orderBy('razao_social', 'asc')
      .select('id', 'razao_social', 'nome_fantasia', 'cnpj')
  }

  // POST /suppliers
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const data = await request.validate(CreateSupplier)

    const cnpj = onlyDigits(data.cnpj)
    if (!isValidCnpj(cnpj)) {
      return response.status(422).json({ message: 'CNPJ inválido.' })
    }
    const dup = await Supplier.query().where('cnpj', cnpj).first()
    if (dup) {
      return response.status(422).json({ message: 'Já existe fornecedor com este CNPJ.' })
    }

    const supplier = await Supplier.create({
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || null,
      cnpj,
      cidade: data.cidade || null,
      estado: data.estado ? data.estado.toUpperCase() : null,
      telefone: data.telefone || null,
      email: data.email || null,
      contato: data.contato || null,
      observacoes: data.observacoes || null,
      status: 'ativo',
      created_by: user.id,
      updated_by: user.id,
    })

    await AuditLogger.log(ctx, {
      action: 'SUPPLIER_CREATE',
      entityType: 'supplier',
      entityId: supplier.id,
      details: { cnpj, razao_social: data.razao_social },
    })

    return response.status(201).json({ id: supplier.id })
  }

  // PUT /suppliers/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const data = await request.validate(UpdateSupplier)

    const supplier = await Supplier.find(params.id)
    if (!supplier) {
      return response.status(404).json({ message: 'Fornecedor não encontrado.' })
    }

    const cnpj = onlyDigits(data.cnpj)
    if (!isValidCnpj(cnpj)) {
      return response.status(422).json({ message: 'CNPJ inválido.' })
    }
    const dup = await Supplier.query().where('cnpj', cnpj).whereNot('id', supplier.id).first()
    if (dup) {
      return response.status(422).json({ message: 'Já existe fornecedor com este CNPJ.' })
    }

    supplier.merge({
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || null,
      cnpj,
      cidade: data.cidade || null,
      estado: data.estado ? data.estado.toUpperCase() : null,
      telefone: data.telefone || null,
      email: data.email || null,
      contato: data.contato || null,
      status: data.status,
      observacoes: data.observacoes || null,
      updated_by: user.id,
    })
    await supplier.save()

    await AuditLogger.log(ctx, {
      action: 'SUPPLIER_UPDATE',
      entityType: 'supplier',
      entityId: supplier.id,
      details: { cnpj, status: data.status },
    })

    return { ok: true }
  }

  // POST /suppliers/bulk-import
  async bulkImport(ctx) {
    assertRole(ctx, ['admin'])
    const { request, user } = ctx
    const { rows, dryRun } = request.only(['rows', 'dryRun'])

    const existing = await Supplier.query().select('cnpj')
    const existingCnpj = new Set(existing.map((s) => s.cnpj))
    const seen = new Set()
    const results = []
    const toInsert = []

    ;(rows || []).forEach((r, i) => {
      const errs = []
      const cnpj = onlyDigits(r.cnpj || '')
      if (!r.razao_social) errs.push('Razão social obrigatória')
      if (!isValidCnpj(cnpj)) errs.push('CNPJ inválido')
      if (existingCnpj.has(cnpj)) errs.push('CNPJ já cadastrado')
      if (seen.has(cnpj)) errs.push('CNPJ duplicado no arquivo')
      seen.add(cnpj)
      const status = errs.length ? 'erro' : 'ok'
      results.push({ row: i + 2, status, razao_social: r.razao_social, cnpj, errors: errs })
      if (status === 'ok') {
        toInsert.push({
          razao_social: r.razao_social,
          nome_fantasia: r.nome_fantasia || null,
          cnpj,
          cidade: r.cidade || null,
          estado: r.estado ? String(r.estado).toUpperCase().slice(0, 2) : null,
          telefone: r.telefone || null,
          email: r.email || null,
          contato: r.contato || null,
          status: 'ativo',
          created_by: user.id,
          updated_by: user.id,
        })
      }
    })

    let committed = false
    if (!dryRun && toInsert.length > 0 && results.every((r) => r.status === 'ok')) {
      for (const row of toInsert) {
        await Supplier.create(row)
      }
      committed = true
      await AuditLogger.log(ctx, {
        action: 'SUPPLIER_BULK_IMPORT',
        entityType: 'supplier',
        details: { count: toInsert.length },
      })
    }

    return {
      results,
      committed,
      ok: results.filter((r) => r.status === 'ok').length,
      failed: results.filter((r) => r.status === 'erro').length,
    }
  }

  // GET /materials/:id/acquisitions
  async materialAcquisitions(ctx) {
    assertRole(ctx, ['admin'])
    const { params } = ctx
    const rows = await StockMovement.query()
      .where('material_id', params.id)
      .whereIn('type', ['recebimento', 'ajuste_entrada', 'inventario_inicial'])
      .preload('supplier')
      .orderBy('created_at', 'desc')

    return rows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      type: r.type,
      quantity: Number(r.quantity),
      unit_value: Number(r.unit_value_snapshot),
      total_value: Number(r.total_value),
      nf_number: r.nf_number,
      oc_number: r.oc_number,
      justification: r.justification,
      supplier_id: r.supplier_id,
      supplier_name: r.supplier?.razao_social ?? null,
      supplier_cnpj: r.supplier?.cnpj ?? null,
    }))
  }
}

module.exports = SuppliersController
