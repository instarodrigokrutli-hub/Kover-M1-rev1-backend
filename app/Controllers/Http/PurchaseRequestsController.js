'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/PurchaseRequestsController.js
|--------------------------------------------------------------------------
|
| Solicitações de compra (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/purchase.functions.ts — como os nomes já vêm de users.full_name
| direto (Adonis), não precisa de uma tabela "profiles" separada como no
| Supabase original.
|
*/

const PurchaseRequest = require('../../Models/PurchaseRequest')
const { assertRole, hasRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreatePurchaseRequest = require('../../Validators/CreatePurchaseRequest')

function serialize(r) {
  const requesterName = r.requested_by_technician
    ? (r.requesterTechnician?.name ?? 'Técnico')
    : (r.requesterUser?.full_name || r.requesterUser?.email || 'PCM')
  return {
    id: r.id,
    material_name: r.material_name,
    description: r.description,
    quantity: Number(r.quantity),
    unit: r.unit,
    destination: r.destination,
    machine: r.machine,
    priority: r.priority,
    status: r.status,
    requester_name: requesterName,
    requester_kind: r.requested_by_technician ? 'tecnico' : 'pcm',
    analyzer_name: r.analyzer ? (r.analyzer.full_name || r.analyzer.email) : null,
    analyzed_at: r.analyzed_at,
    rejection_reason: r.rejection_reason,
    created_at: r.created_at,
  }
}

class PurchaseRequestsController {
  // POST /purchase-requests (PCM/admin/coordenador — JWT)
  async store(ctx) {
    const { request, response, user } = ctx
    const data = await request.validate(CreatePurchaseRequest)

    const row = await PurchaseRequest.create({
      material_name: data.material_name,
      description: data.description || null,
      quantity: data.quantity,
      unit: data.unit,
      destination: data.destination,
      machine: data.machine || null,
      priority: data.priority || 'media',
      requested_by_user: user.id,
    })

    await AuditLogger.log(ctx, {
      action: 'PURCHASE_REQUEST_CREATE',
      entityType: 'purchase_request',
      entityId: row.id,
      details: { material_name: data.material_name, quantity: data.quantity, unit: data.unit, priority: data.priority },
    })

    return response.status(201).json({ ok: true, id: row.id })
  }

  // POST /purchase-requests/tech (técnico — cookie)
  async storeTech(ctx) {
    const { request, response, technician } = ctx
    const data = await request.validate(CreatePurchaseRequest)

    const row = await PurchaseRequest.create({
      material_name: data.material_name,
      description: data.description || null,
      quantity: data.quantity,
      unit: data.unit,
      destination: data.destination,
      machine: data.machine || null,
      priority: data.priority || 'media',
      requested_by_technician: technician.id,
    })

    await AuditLogger.log(ctx, {
      action: 'PURCHASE_REQUEST_CREATE',
      entityType: 'purchase_request',
      entityId: row.id,
      details: { material_name: data.material_name, quantity: data.quantity, unit: data.unit, priority: data.priority },
    })

    return response.status(201).json({ ok: true, id: row.id })
  }

  // GET /purchase-requests/mine (técnico — cookie)
  async mine({ technician }) {
    const rows = await PurchaseRequest.query()
      .where('requested_by_technician', technician.id)
      .orderBy('created_at', 'desc')
      .limit(50)
    return rows.map((r) => ({
      id: r.id, material_name: r.material_name, description: r.description,
      quantity: Number(r.quantity), unit: r.unit, destination: r.destination,
      machine: r.machine, priority: r.priority, status: r.status,
      rejection_reason: r.rejection_reason, created_at: r.created_at, analyzed_at: r.analyzed_at,
    }))
  }

  // GET /purchase-requests (PCM/Coordenador)
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { status, priority, requester, from, to } = request.qs()

    const query = PurchaseRequest.query()
      .preload('requesterUser')
      .preload('requesterTechnician')
      .preload('analyzer')
      .orderBy('created_at', 'desc')
      .limit(300)
    if (status && status !== 'todos') query.where('status', status)
    if (priority && priority !== 'todos') query.where('priority', priority)
    if (from) query.where('created_at', '>=', `${from} 00:00:00`)
    if (to) query.where('created_at', '<=', `${to} 23:59:59`)

    const rows = await query
    const mapped = rows.map(serialize)
    const q = (requester ?? '').trim().toLowerCase()
    return q ? mapped.filter((r) => r.requester_name.toLowerCase().includes(q)) : mapped
  }

  // PATCH /purchase-requests/:id/approve
  async approve(ctx) {
    if (!hasRole(ctx, ['coordenador'])) {
      return ctx.response.status(403).json({ message: 'Apenas coordenadores podem aprovar solicitações.' })
    }
    const { params, response, user } = ctx
    const pr = await PurchaseRequest.find(params.id)
    if (!pr) return response.status(404).json({ message: 'Solicitação não encontrada.' })
    if (pr.status !== 'pendente') return response.status(422).json({ message: 'Solicitação já analisada.' })

    pr.status = 'aprovada'
    pr.analyzed_by_user = user.id
    pr.analyzed_at = require('luxon').DateTime.local()
    pr.rejection_reason = null
    await pr.save()

    await AuditLogger.log(ctx, {
      action: 'PURCHASE_REQUEST_APPROVE',
      entityType: 'purchase_request',
      entityId: pr.id,
    })
    return { ok: true }
  }

  // PATCH /purchase-requests/:id/reject
  async reject(ctx) {
    if (!hasRole(ctx, ['coordenador'])) {
      return ctx.response.status(403).json({ message: 'Apenas coordenadores podem reprovar solicitações.' })
    }
    const { params, request, response, user } = ctx
    const { reason } = request.only(['reason'])
    if (!reason || String(reason).trim().length < 2) {
      return response.status(422).json({ message: 'Informe um motivo.' })
    }
    const pr = await PurchaseRequest.find(params.id)
    if (!pr) return response.status(404).json({ message: 'Solicitação não encontrada.' })
    if (pr.status !== 'pendente') return response.status(422).json({ message: 'Solicitação já analisada.' })

    pr.status = 'reprovada'
    pr.analyzed_by_user = user.id
    pr.analyzed_at = require('luxon').DateTime.local()
    pr.rejection_reason = reason
    await pr.save()

    await AuditLogger.log(ctx, {
      action: 'PURCHASE_REQUEST_REJECT',
      entityType: 'purchase_request',
      entityId: pr.id,
      details: { reason },
    })
    return { ok: true }
  }
}

module.exports = PurchaseRequestsController
