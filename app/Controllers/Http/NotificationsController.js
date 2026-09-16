'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/NotificationsController.js
|--------------------------------------------------------------------------
|
| Central de Notificações (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/notifications.functions.ts.
|
| Lido/excluído são POR USUÁRIO (user_notification_states) — antes eram
| colunas globais em notifications (is_read/read_at/read_by), então a
| notificação que um Coordenador marcava como lida sumia como não-lida
| pra todo mundo, e não existia "excluir" nenhum. As colunas antigas
| continuam na tabela (não usadas) só pra não quebrar a migration.
|
*/

const { DateTime } = require('luxon')
const NotificationModel = require('../../Models/Notification')
const UserNotificationState = require('../../Models/UserNotificationState')
const UserNotificationPreference = require('../../Models/UserNotificationPreference')
const WorkOrder = require('../../Models/WorkOrder')
const { assertRole } = require('../../Services/Authorization')
const Notify = require('../../Services/Notify')

function toIso(v) {
  if (!v) return null
  return DateTime.isDateTime(v) ? v.toISO() : String(v)
}
function serialize(n, isRead) {
  return {
    id: n.id, type: n.type, category: n.category, title: n.title, description: n.description,
    event_at: toIso(n.event_at), actor_name: n.actor_name, machine_id: n.machine_id, machine_name: n.machine_name,
    work_order_id: n.work_order_id, work_order_number: n.work_order_number,
    priority: n.priority, is_read: isRead, read_at: null,
  }
}

async function disabledTypesFor(userId) {
  const rows = await UserNotificationPreference.query().where('user_id', userId).where('ativo', false).select('evento')
  return rows.map((r) => r.evento)
}

async function dismissedIdsFor(userId) {
  const rows = await UserNotificationState.query().where('user_id', userId).where('dismissed', true).select('notification_id')
  return rows.map((r) => r.notification_id)
}

async function upsertState(userId, notificationId, changes) {
  const existing = await UserNotificationState.query()
    .where('user_id', userId).where('notification_id', notificationId).first()
  if (existing) {
    existing.merge(changes)
    await existing.save()
    return existing
  }
  return UserNotificationState.create({ user_id: userId, notification_id: notificationId, ...changes })
}

/** Notificações "vivas" pra este usuário: não excluídas, não desativadas na preferência pessoal. */
async function visibleNotificationsQuery(userId) {
  const [disabledTypes, dismissedIds] = await Promise.all([
    disabledTypesFor(userId), dismissedIdsFor(userId),
  ])
  const query = NotificationModel.query()
  if (disabledTypes.length) query.whereNotIn('type', disabledTypes)
  if (dismissedIds.length) query.whereNotIn('id', dismissedIds)
  return query
}

async function computeUnreadCount(userId) {
  const all = await (await visibleNotificationsQuery(userId)).select('id')
  const allIds = all.map((n) => n.id)
  if (allIds.length === 0) return 0
  const readIds = await UserNotificationState.query()
    .where('user_id', userId).where('is_read', true).whereIn('notification_id', allIds).select('notification_id')
  const read = new Set(readIds.map((r) => r.notification_id))
  return allIds.filter((id) => !read.has(id)).length
}

class NotificationsController {
  // POST /notifications/list
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request, user } = ctx
    const { category = 'todas', type, priority = 'todas', onlyUnread, from, to, limit = 100 } = request.post()

    const query = await visibleNotificationsQuery(user.id)
    query.orderBy('event_at', 'desc')
    if (category !== 'todas') query.where('category', category)
    if (type) query.where('type', type)
    if (priority !== 'todas') query.where('priority', priority)
    if (from) query.where('event_at', '>=', `${from} 00:00:00`)
    if (to) query.where('event_at', '<=', `${to} 23:59:59`)

    // "onlyUnread" depende do estado por usuário, que só sabemos depois de
    // buscar — por isso busca um lote maior e filtra/corta em memória.
    const candidateCap = onlyUnread ? Math.min(Math.max(limit * 5, 200), 1000) : limit
    const candidates = await query.limit(candidateCap)
    const candidateIds = candidates.map((n) => n.id)
    const states = candidateIds.length
      ? await UserNotificationState.query().where('user_id', user.id).whereIn('notification_id', candidateIds).select('notification_id', 'is_read')
      : []
    const readMap = new Map(states.map((s) => [s.notification_id, !!s.is_read]))

    let rows = candidates.map((n) => serialize(n, readMap.get(n.id) ?? false))
    if (onlyUnread) rows = rows.filter((r) => !r.is_read)
    rows = rows.slice(0, limit)

    const unread = await computeUnreadCount(user.id)
    return { rows, unread }
  }

  // GET /notifications/unread-count
  async unreadCount(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    return computeUnreadCount(ctx.user.id)
  }

  // PATCH /notifications/:id/read
  async markRead(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { params, request, response, user } = ctx
    const { read = true } = request.only(['read'])

    const n = await NotificationModel.find(params.id)
    if (!n) return response.status(404).json({ message: 'Notificação não encontrada.' })

    await upsertState(user.id, n.id, { is_read: read, read_at: read ? DateTime.local() : null })
    return { ok: true }
  }

  // PATCH /notifications/read-all
  async markAllRead(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { user } = ctx
    const all = await (await visibleNotificationsQuery(user.id)).select('id')
    const now = DateTime.local()
    for (const n of all) {
      await upsertState(user.id, n.id, { is_read: true, read_at: now })
    }
    return { ok: true }
  }

  // DELETE /notifications/:id — some só da visão deste usuário; a
  // notificação e o histórico continuam intactos pra quem mais a vê.
  async destroy(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { params, response, user } = ctx
    const n = await NotificationModel.find(params.id)
    if (!n) return response.status(404).json({ message: 'Notificação não encontrada.' })

    await upsertState(user.id, n.id, { dismissed: true, dismissed_at: DateTime.local() })
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
