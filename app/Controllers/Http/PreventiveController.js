'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/PreventiveController.js
|--------------------------------------------------------------------------
|
| Manutenção Preventiva (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/preventive.functions.ts. A Preventiva é uma ESPECIALIZAÇÃO da OS
| existente (mesma tabela work_orders, maintenance_type='preventiva') —
| já Adonis-nativa desde a Fase 1; só os planos/checklist eram novos.
|
| Diferença deliberada do original: o nome do ator (PCM) vem direto de
| ctx.user.full_name — o Supabase original precisava de uma tabela
| "profiles" à parte porque auth.users não guardava full_name.
|
*/

const { DateTime } = require('luxon')
const MaintenancePlan = require('../../Models/MaintenancePlan')
const MaintenancePlanItem = require('../../Models/MaintenancePlanItem')
const WorkOrder = require('../../Models/WorkOrder')
const WorkOrderChecklistItem = require('../../Models/WorkOrderChecklistItem')
const WorkOrderEvent = require('../../Models/WorkOrderEvent')
const Technician = require('../../Models/Technician')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const Notify = require('../../Services/Notify')
const SaveMaintenancePlan = require('../../Validators/SaveMaintenancePlan')
const SavePlanItem = require('../../Validators/SavePlanItem')

const OPEN_ST = ['aguardando_atendimento', 'reaberta']
const WORKING_ST = ['aceita', 'em_atendimento', 'pausada']
const DONE_ST = ['aguardando_avaliacao', 'concluida', 'encerrada', 'cancelada']

function toIso(v) {
  if (!v) return null
  return DateTime.isDateTime(v) ? v.toISO() : String(v)
}
function minutesBetween(a, b) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000))
}

class PreventiveController {
  // ---------- Planos: leitura ----------

  // GET /maintenance-plans
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { term = '', only_active } = request.qs()

    const query = MaintenancePlan.query().preload('machine').preload('items').orderBy('created_at', 'desc')
    if (only_active === 'true' || only_active === true) query.where('active', true)

    const rows = await query
    const t = String(term).toLowerCase()
    return rows
      .map((p) => ({
        id: p.id,
        machine_id: p.machine_id,
        machine_name: p.machine?.name ?? '—',
        machine_code: p.machine?.code ?? null,
        machine_sector: p.machine?.sector ?? '—',
        name: p.name,
        description: p.description ?? '',
        service_type: p.service_type,
        periodicity: p.periodicity,
        periodicity_value: p.periodicity_value == null ? null : Number(p.periodicity_value),
        estimated_minutes: Number(p.estimated_minutes ?? 0),
        due_days: Number(p.due_days ?? 0),
        active: !!p.active,
        last_generated_at: toIso(p.last_generated_at),
        items_count: (p.items ?? []).length,
        created_at: toIso(p.created_at),
      }))
      .filter((p) =>
        !t ||
        p.name.toLowerCase().includes(t) ||
        p.machine_name.toLowerCase().includes(t) ||
        (p.machine_code ?? '').toLowerCase().includes(t) ||
        p.machine_sector.toLowerCase().includes(t))
  }

  // GET /maintenance-plans/:id
  async show(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { params, response } = ctx
    const plan = await MaintenancePlan.query().where('id', params.id).preload('machine').first()
    if (!plan) return response.status(404).json({ message: 'Plano não encontrado.' })

    const items = await MaintenancePlanItem.query().where('plan_id', params.id).orderBy('position', 'asc')

    return {
      id: plan.id,
      machine_id: plan.machine_id,
      machine_name: plan.machine?.name ?? '—',
      machine_code: plan.machine?.code ?? null,
      machine_sector: plan.machine?.sector ?? '—',
      name: plan.name,
      description: plan.description,
      service_type: plan.service_type,
      periodicity: plan.periodicity,
      periodicity_value: plan.periodicity_value == null ? null : Number(plan.periodicity_value),
      estimated_minutes: Number(plan.estimated_minutes ?? 0),
      due_days: Number(plan.due_days ?? 0),
      active: !!plan.active,
      last_generated_at: toIso(plan.last_generated_at),
      created_at: toIso(plan.created_at),
      items: items.map((i) => ({
        id: i.id, plan_id: i.plan_id, description: i.description,
        position: i.position, notes: i.notes, required: !!i.required,
      })),
    }
  }

  // ---------- Planos: escrita (somente PCM) ----------

  // POST /maintenance-plans
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const data = await request.validate(SaveMaintenancePlan)

    const plan = await MaintenancePlan.create({
      ...data,
      periodicity_value: data.periodicity_value ?? null,
      active: data.active ?? true,
      created_by: user.id,
      updated_by: user.id,
    })

    await AuditLogger.log(ctx, { action: 'PLAN_CREATE', entityType: 'maintenance_plan', entityId: plan.id, details: { name: data.name } })
    return response.status(201).json({ ok: true, id: plan.id })
  }

  // PUT /maintenance-plans/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const data = await request.validate(SaveMaintenancePlan)

    const plan = await MaintenancePlan.find(params.id)
    if (!plan) return response.status(404).json({ message: 'Plano não encontrado.' })

    plan.merge({ ...data, periodicity_value: data.periodicity_value ?? null, updated_by: user.id })
    await plan.save()

    await AuditLogger.log(ctx, { action: 'PLAN_UPDATE', entityType: 'maintenance_plan', entityId: plan.id, details: { name: data.name } })
    return { ok: true }
  }

  // DELETE /maintenance-plans/:id
  async destroy(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const generated = await WorkOrder.query().where('plan_id', params.id).select('id')
    if (generated.length > 0) {
      return response.status(422).json({ message: 'Este plano já possui preventivas geradas. Desative-o em vez de excluir.' })
    }
    const plan = await MaintenancePlan.find(params.id)
    if (!plan) return response.status(404).json({ message: 'Plano não encontrado.' })
    await plan.delete()

    await AuditLogger.log(ctx, { action: 'PLAN_DELETE', entityType: 'maintenance_plan', entityId: params.id })
    return { ok: true }
  }

  // ---------- Itens do checklist do plano ----------

  // POST /maintenance-plan-items
  async saveItem(ctx) {
    assertRole(ctx, ['admin'])
    const { request } = ctx
    const data = await request.validate(SavePlanItem)

    if (data.id) {
      const item = await MaintenancePlanItem.find(data.id)
      item.description = data.description
      item.notes = data.notes ?? null
      item.required = data.required ?? true
      await item.save()
      return { ok: true, id: item.id }
    }

    const last = await MaintenancePlanItem.query().where('plan_id', data.plan_id).orderBy('position', 'desc').first()
    const item = await MaintenancePlanItem.create({
      plan_id: data.plan_id,
      description: data.description,
      notes: data.notes ?? null,
      required: data.required ?? true,
      position: Number(last?.position ?? -1) + 1,
    })
    return { ok: true, id: item.id }
  }

  // DELETE /maintenance-plan-items/:id
  async deleteItem(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const item = await MaintenancePlanItem.find(params.id)
    if (!item) return response.status(404).json({ message: 'Item não encontrado.' })
    await item.delete()
    return { ok: true }
  }

  // POST /maintenance-plan-items/reorder
  async reorderItems(ctx) {
    assertRole(ctx, ['admin'])
    const { request } = ctx
    const { plan_id, ordered_ids } = request.only(['plan_id', 'ordered_ids'])
    for (let i = 0; i < ordered_ids.length; i++) {
      await MaintenancePlanItem.query().where('id', ordered_ids[i]).where('plan_id', plan_id).update({ position: i })
    }
    return { ok: true }
  }

  // ---------- Programar Preventiva (gera uma OS do tipo preventiva) ----------

  // POST /preventives/generate
  async generate(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const { plan_id, opened_at, due_at, priority = 'media' } = request.only(['plan_id', 'opened_at', 'due_at', 'priority'])

    const plan = await MaintenancePlan.query().where('id', plan_id).preload('machine').first()
    if (!plan) return response.status(404).json({ message: 'Plano não encontrado.' })
    if (!plan.active) return response.status(422).json({ message: 'Plano inativo. Ative-o antes de programar.' })
    const machine = plan.machine
    if (!machine) return response.status(422).json({ message: 'Máquina do plano não encontrada.' })

    const openedAt = opened_at ? new Date(`${opened_at}T08:00:00`) : new Date()
    const dueAt = due_at ? new Date(`${due_at}T23:59:59`) : new Date(openedAt.getTime() + Number(plan.due_days ?? 7) * 86400000)

    const wo = await WorkOrder.create({
      requester_user_id: user.id,
      requester_name: user.full_name ?? 'PCM',
      machine_id: machine.id,
      machine_code: machine.code ?? null,
      machine_name: machine.name,
      machine_sector: machine.sector,
      priority,
      description: `[PREVENTIVA] ${plan.name} — ${plan.description}`,
      status: 'aguardando_atendimento',
      opened_at: DateTime.fromJSDate(openedAt),
      maintenance_type: 'preventiva',
      plan_id: plan.id,
      due_at: DateTime.fromJSDate(dueAt),
      estimated_minutes: Number(plan.estimated_minutes ?? 60),
      service_type: plan.service_type,
    })

    const items = await MaintenancePlanItem.query().where('plan_id', plan.id).orderBy('position', 'asc')
    for (const i of items) {
      await WorkOrderChecklistItem.create({
        work_order_id: wo.id, plan_item_id: i.id, description: i.description,
        position: i.position, notes: i.notes, required: i.required,
      })
    }

    plan.last_generated_at = DateTime.local()
    await plan.save()

    await WorkOrderEvent.create({
      work_order_id: wo.id, event_type: 'open',
      technician_name: user.full_name ?? 'PCM',
      message: `Preventiva programada pelo PCM — plano "${plan.name}".`,
      details: { plan_id: plan.id, due_at: dueAt.toISOString() },
    })
    await AuditLogger.log(ctx, {
      action: 'PREVENTIVE_GENERATE', entityType: 'work_order', entityId: wo.id,
      details: { number: wo.number, plan: plan.name },
    })

    await Notify.notifyWorkOrder('preventiva_criada', {
      id: wo.id, number: wo.number, machine_id: machine.id, machine_name: machine.name, maintenance_type: 'preventiva',
    }, {
      description: `Preventiva programada pelo PCM — plano "${plan.name}". Prazo: ${dueAt.toLocaleDateString('pt-BR')}.`,
      actor_name: user.full_name ?? 'PCM',
      actor_user_id: user.id,
      payload: { plan_id: plan.id, due_at: dueAt.toISOString() },
    })

    return { ok: true, id: wo.id, number: wo.number }
  }

  // ---------- Listagens de preventivas ----------

  async _fetchPreventives(scope, from, to) {
    const query = WorkOrder.query()
      .where('maintenance_type', 'preventiva')
      .preload('plan')
      .preload('checklistItems')
      .orderBy('due_at', 'asc')
      .limit(500)

    if (scope === 'programadas') query.whereIn('status', OPEN_ST)
    else if (scope === 'execucao') query.whereIn('status', WORKING_ST)
    else if (scope === 'historico') query.whereIn('status', DONE_ST)
    if (from) query.where('opened_at', '>=', `${from} 00:00:00`)
    if (to) query.where('opened_at', '<=', `${to} 23:59:59`)

    const rows = await query

    const techIds = Array.from(new Set(rows.map((r) => r.technician_id).filter(Boolean)))
    const names = {}
    if (techIds.length) {
      const techs = await Technician.query().whereIn('id', techIds).select('id', 'name')
      for (const t of techs) names[t.id] = t.name
    }

    const now = Date.now()
    return rows.map((w) => {
      const checklist = w.checklistItems ?? []
      const openStatus = !DONE_ST.includes(w.status)
      const dueAtIso = toIso(w.due_at)
      return {
        id: w.id,
        number: w.number,
        machine_name: w.machine_name,
        machine_code: w.machine_code ?? null,
        machine_sector: w.machine_sector,
        plan_name: w.plan?.name ?? null,
        status: w.status,
        priority: w.priority,
        opened_at: toIso(w.opened_at),
        due_at: dueAtIso,
        started_at: toIso(w.started_at),
        finished_at: toIso(w.finished_at),
        validated_at: toIso(w.validated_at),
        technician_name: w.technician_id ? (names[w.technician_id] ?? null) : null,
        estimated_minutes: w.estimated_minutes ?? null,
        duration_minutes: w.started_at && w.finished_at ? minutesBetween(w.started_at, w.finished_at) : null,
        overdue: !!dueAtIso && openStatus && new Date(dueAtIso).getTime() < now,
        checklist_total: checklist.length,
        checklist_done: checklist.filter((c) => c.status === 'concluido' || c.status === 'nao_se_aplica').length,
      }
    })
  }

  // GET /preventives
  async list(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { scope = 'todas', from, to } = request.qs()
    return this._fetchPreventives(scope, from, to)
  }

  // GET /preventives/overview
  async overview(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const all = await this._fetchPreventives('todas')
    const now = new Date()
    const startWeek = new Date(now); startWeek.setHours(0, 0, 0, 0); startWeek.setDate(startWeek.getDate() - startWeek.getDay())
    const endWeek = new Date(startWeek); endWeek.setDate(endWeek.getDate() + 7)
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const inRange = (iso, a, b) => !!iso && new Date(iso).getTime() >= a.getTime() && new Date(iso).getTime() < b.getTime()

    const week = all.filter((p) => inRange(p.due_at ?? p.opened_at, startWeek, endWeek))
    const month = all.filter((p) => inRange(p.due_at ?? p.opened_at, startMonth, endMonth))
    const overdue = all.filter((p) => p.overdue)
    const done = all.filter((p) => DONE_ST.includes(p.status) && p.status !== 'cancelada')
    const running = all.filter((p) => WORKING_ST.includes(p.status))
    const scheduled = all.filter((p) => OPEN_ST.includes(p.status))
    const durations = done.map((p) => p.duration_minutes).filter((n) => n != null)
    const avgMinutes = durations.length ? Math.round(durations.reduce((s, n) => s + n, 0) / durations.length) : null
    const closedOnTime = done.filter((p) => !p.due_at || !p.finished_at || new Date(p.finished_at).getTime() <= new Date(p.due_at).getTime()).length
    const compliance = done.length ? Math.round((closedOnTime / done.length) * 100) : null

    return {
      totals: { scheduled: scheduled.length, running: running.length, overdue: overdue.length, done: done.length, avgMinutes, compliance },
      week, month, overdue, done: done.slice(0, 50),
    }
  }

  // GET /preventives/:id
  async show2(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { params, response } = ctx
    const wo = await WorkOrder.query()
      .where('id', params.id)
      .where('maintenance_type', 'preventiva')
      .preload('plan')
      .preload('checklistItems')
      .preload('events')
      .preload('comments')
      .preload('participants')
      .preload('materials', (q) => q.preload('material'))
      .preload('pauses')
      .first()
    if (!wo) return response.status(404).json({ message: 'Preventiva não encontrada.' })

    return {
      id: wo.id, number: wo.number, status: wo.status, priority: wo.priority,
      description: wo.description, machine_id: wo.machine_id, machine_name: wo.machine_name,
      machine_code: wo.machine_code, machine_sector: wo.machine_sector,
      opened_at: toIso(wo.opened_at), started_at: toIso(wo.started_at), finished_at: toIso(wo.finished_at),
      due_at: toIso(wo.due_at), validated_at: toIso(wo.validated_at), validation_comment: wo.validation_comment,
      technician_id: wo.technician_id, technician_comment: wo.technician_comment, final_comment: wo.final_comment,
      plan_name: wo.plan?.name ?? null,
      can_manage: true,
      checklist: (wo.checklistItems ?? []).map((c) => ({
        id: c.id, description: c.description, position: c.position, notes: c.notes,
        required: !!c.required, status: c.status, technician_name: c.technician_name,
        updated_at: toIso(c.updated_at),
      })),
      events: (wo.events ?? []).map((e) => ({
        id: e.id, event_type: e.event_type, message: e.message,
        technician_name: e.technician_name, created_at: toIso(e.created_at),
      })),
      comments: (wo.comments ?? []).map((c) => ({
        id: c.id, comment: c.comment, technician_name: c.technician_name, created_at: toIso(c.created_at),
      })),
      participants: (wo.participants ?? []).map((p) => ({
        technician_name: p.technician_name, first_joined_at: toIso(p.first_joined_at), last_active_at: toIso(p.last_active_at),
      })),
      pauses: (wo.pauses ?? []).map((p) => ({
        id: p.id, reason: p.reason, started_at: toIso(p.started_at), ended_at: toIso(p.ended_at),
      })),
      items: (wo.materials ?? []).map((i) => ({
        id: i.id, quantity: Number(i.quantity), total_value: Number(i.total_value),
        material_code: i.material?.code, material_name: i.material?.name, unit: i.material?.unit,
        created_at: toIso(i.created_at),
      })),
    }
  }

  // ---------- Validação / cancelamento pelo PCM ----------

  // POST /preventives/:id/validate
  async validate(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const { approved, comment } = request.only(['approved', 'comment'])

    const wo = await WorkOrder.find(params.id)
    if (!wo || wo.maintenance_type !== 'preventiva') return response.status(404).json({ message: 'Preventiva não encontrada.' })
    if (!['aguardando_avaliacao', 'concluida'].includes(wo.status)) {
      return response.status(422).json({ message: 'Esta preventiva ainda não foi concluída pelo técnico.' })
    }

    const now = DateTime.local()
    wo.status = approved ? 'encerrada' : 'reaberta'
    wo.validated_at = approved ? now : null
    wo.validated_by = approved ? user.id : null
    wo.validation_comment = comment ?? null
    if (!approved) {
      wo.reopen_reason = comment ?? 'Reprovada pelo PCM'
      wo.reopened_at = now
    }
    await wo.save()

    await WorkOrderEvent.create({
      work_order_id: wo.id,
      event_type: approved ? 'validate' : 'reopen',
      technician_name: user.full_name ?? 'PCM',
      message: approved ? 'PCM validou a conclusão da preventiva.' : `PCM reprovou a conclusão — ${comment ?? 'sem motivo informado'}.`,
    })
    await AuditLogger.log(ctx, {
      action: approved ? 'PREVENTIVE_VALIDATE' : 'PREVENTIVE_REJECT',
      entityType: 'work_order', entityId: wo.id, details: { number: wo.number },
    })

    await Notify.notifyWorkOrder(approved ? 'preventiva_concluida' : 'os_reaberta', {
      id: wo.id, number: wo.number, machine_id: wo.machine_id, machine_name: wo.machine_name, maintenance_type: 'preventiva',
    }, {
      description: approved ? 'PCM validou a conclusão da preventiva.' : `PCM reprovou a conclusão — ${comment ?? 'sem motivo informado'}.`,
      actor_name: user.full_name ?? 'PCM',
      actor_user_id: user.id,
    })

    return { ok: true }
  }

  // POST /preventives/:id/cancel
  async cancel(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const { reason } = request.only(['reason'])
    if (!reason || String(reason).trim().length < 3) {
      return response.status(422).json({ message: 'Informe o motivo.' })
    }

    const wo = await WorkOrder.query()
      .where('id', params.id)
      .where('maintenance_type', 'preventiva')
      .whereIn('status', [...OPEN_ST, ...WORKING_ST])
      .first()
    if (!wo) return response.status(422).json({ message: 'Esta preventiva não pode mais ser cancelada.' })

    wo.status = 'cancelada'
    wo.validation_comment = reason
    await wo.save()

    await WorkOrderEvent.create({
      work_order_id: wo.id, event_type: 'cancel',
      technician_name: user.full_name ?? 'PCM',
      message: `PCM cancelou a preventiva — ${reason}.`,
    })
    await AuditLogger.log(ctx, {
      action: 'PREVENTIVE_CANCEL', entityType: 'work_order', entityId: wo.id,
      details: { number: wo.number, reason },
    })
    return { ok: true }
  }

  // ---------- Indicadores ----------

  // GET /preventives/indicators
  async indicators(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { from, to } = request.qs()
    const rows = await this._fetchPreventives('todas', from, to)
    const done = rows.filter((r) => ['encerrada', 'concluida', 'aguardando_avaliacao'].includes(r.status))
    const durations = done.map((r) => r.duration_minutes).filter((n) => n != null)
    const avgMinutes = durations.length ? Math.round(durations.reduce((s, n) => s + n, 0) / durations.length) : null
    const onTime = done.filter((r) => !r.due_at || !r.finished_at || new Date(r.finished_at).getTime() <= new Date(r.due_at).getTime()).length
    return {
      scheduled: rows.filter((r) => OPEN_ST.includes(r.status)).length,
      running: rows.filter((r) => WORKING_ST.includes(r.status)).length,
      overdue: rows.filter((r) => r.overdue).length,
      done: done.length,
      total: rows.length,
      avgMinutes,
      compliance: done.length ? Math.round((onTime / done.length) * 100) : null,
      rows,
    }
  }
}

module.exports = PreventiveController
