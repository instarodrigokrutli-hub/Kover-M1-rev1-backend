'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/NotificationsController.js
|--------------------------------------------------------------------------
|
| Central de Notificações (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/notifications.functions.ts.
|
*/

const { DateTime } = require('luxon')
const NotificationModel = require('../../Models/Notification')
const WorkOrder = require('../../Models/WorkOrder')
const { assertRole } = require('../../Services/Authorization')
const Notify = require('../../Services/Notify')

function toIso(v) {
  if (!v) return null
  return DateTime.isDateTime(v) ? v.toISO() : String(v)
}
function serialize(n) {
  return {
    id: n.id, type: n.type, category: n.category, title: n.title, description: n.description,
    event_at: toIso(n.event_at), actor_name: n.actor_name, machine_id: n.machine_id, machine_name: n.machine_name,
    work_order_id: n.work_order_id, work_order_number: n.work_order_number,
    priority: n.priority, is_read: !!n.is_read, read_at: toIso(n.read_at),
  }
}

class NotificationsController {
  // POST /notifications/list
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { category = 'todas', type, priority = 'todas', onlyUnread, from, to, limit = 100 } = request.post()

    const query = NotificationModel.query().orderBy('event_at', 'desc').limit(limit)
    if (category !== 'todas') query.where('category', category)
    if (type) query.where('type', type)
    if (priority !== 'todas') query.where('priority', priority)
    if (onlyUnread) query.where('is_read', false)
    if (from) query.where('event_at', '>=', `${from} 00:00:00`)
    if (to) query.where('event_at', '<=', `${to} 23:59:59`)

    const rows = await query
    const unreadRows = await NotificationModel.query().where('is_read', false).select('id')

    return { rows: rows.map(serialize), unread: unreadRows.length }
  }

  // GET /notifications/unread-count
  async unreadCount(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const rows = await NotificationModel.query().where('is_read', false).select('id')
    return rows.length
  }

  // PATCH /notifications/:id/read
  async markRead(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { params, request, response, user } = ctx
    const { read = true } = request.only(['read'])

    const n = await NotificationModel.find(params.id)
    if (!n) return response.status(404).json({ message: 'Notificação não encontrada.' })

    n.is_read = read
    n.read_at = read ? DateTime.local() : null
    n.read_by = read ? user.id : null
    await n.save()
    return { ok: true }
  }

  // PATCH /notifications/read-all
  async markAllRead(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { user } = ctx
    await NotificationModel.query().where('is_read', false).update({
      is_read: true, read_at: DateTime.local().toSQL({ includeOffset: false }), read_by: user.id,
    })
    return { ok: true }
  }

  // POST /notifications/sync-overdue-preventives
  async syncOverduePreventives(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const now = DateTime.local().toSQL({ includeOffset: false })

    const overdue = await WorkOrder.query()
      .where('maintenance_type', 'preventiva')
      .where('due_at', '<', now)
      .whereIn('status', ['aguardando_atendimento', 'aceita', 'em_atendimento', 'pausada', 'reaberta'])
      .limit(200)

    if (overdue.length === 0) return { created: 0 }

    const ids = overdue.map((w) => w.id)
    const existing = await NotificationModel.query()
      .where('type', 'preventiva_atrasada')
      .whereIn('work_order_id', ids)
      .select('work_order_id')
    const already = new Set(existing.map((n) => n.work_order_id))

    let created = 0
    for (const w of overdue) {
      if (already.has(w.id)) continue
      await Notify.notify({
        type: 'preventiva_atrasada',
        title: `Preventiva atrasada — OS ${w.number}`,
        description: `A preventiva da máquina ${w.machine_name ?? '—'} ultrapassou o prazo previsto.`,
        machine_id: w.machine_id ?? null,
        machine_name: w.machine_name ?? null,
        work_order_id: w.id,
        work_order_number: w.number,
        payload: { due_at: toIso(w.due_at) },
      })
      created += 1
    }
    return { created }
  }
}

module.exports = NotificationsController
