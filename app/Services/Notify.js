'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/Notify.js
|--------------------------------------------------------------------------
|
| Infraestrutura central de notificações — réplica de
| src/lib/notifications.server.ts, agora rodando inteiramente no Adonis
| (antes vivia no frontend, chamando o Supabase).
|
*/

const { DateTime } = require('luxon')
const NotificationModel = require('../Models/Notification')
const { getEventRules } = require('./NotificationRules')
const { NOTIFICATION_TYPE_LABEL, CATEGORY_BY_TYPE, PRIORITY_BY_TYPE, PUSH_TYPES } = require('./NotificationConstants')
const Push = require('./Push')

async function dispatchPush(notificationId, pushProfiles) {
  try {
    const n = await NotificationModel.find(notificationId)
    if (!n) return

    const blockedByRules = Array.isArray(pushProfiles) && pushProfiles.length === 0
    if (blockedByRules || !PUSH_TYPES.has(n.type)) {
      n.push_status = 'ignorado'
      await n.save()
      return
    }

    const link = n.work_order_id
      ? n.category === 'preventiva' ? `/preventivas/${n.work_order_id}` : `/tecnico/os/${n.work_order_id}`
      : '/'

    const sent = await Push.sendPushToActiveDevices({
      title: n.title,
      body: n.description || '',
      link,
      profiles: pushProfiles ?? null,
      data: { notification_id: String(n.id), type: n.type, work_order_id: n.work_order_id ? String(n.work_order_id) : '' },
    })

    n.push_status = sent > 0 ? 'enviado' : 'falhou'
    n.push_sent_at = sent > 0 ? DateTime.local() : null
    await n.save()
  } catch (e) {
    console.error('[dispatchPush]', e)
  }
}

/** Registra uma notificação. Nunca lança: falha de notificação não quebra o fluxo. */
async function notify(input) {
  try {
    const rules = await getEventRules(input.type)
    if (rules.configured && rules.systemProfiles.length === 0 && rules.pushProfiles.length === 0) {
      return null
    }

    const row = await NotificationModel.create({
      type: input.type,
      category: input.category ?? CATEGORY_BY_TYPE[input.type] ?? 'os',
      title: input.title,
      description: input.description ?? '',
      priority: input.priority ?? rules.priority ?? PRIORITY_BY_TYPE[input.type] ?? 'informativa',
      event_at: input.event_at ? DateTime.fromJSDate(new Date(input.event_at)) : DateTime.local(),
      actor_user_id: input.actor_user_id ?? null,
      actor_technician_id: input.actor_technician_id ?? null,
      actor_name: input.actor_name ?? null,
      machine_id: input.machine_id ?? null,
      machine_name: input.machine_name ?? null,
      work_order_id: input.work_order_id ?? null,
      work_order_number: input.work_order_number ?? null,
      payload: input.payload ?? {},
    })

    await dispatchPush(row.id, rules.configured ? rules.pushProfiles : null)
    return row.id
  } catch (e) {
    console.error('[notify]', e)
    return null
  }
}

/** Atalho para eventos vinculados a uma Ordem de Serviço. */
async function notifyWorkOrder(type, wo, opts = {}) {
  const isPreventive = wo.maintenance_type === 'preventiva'
  const label = NOTIFICATION_TYPE_LABEL[type] ?? 'Evento'
  return notify({
    type,
    category: isPreventive && CATEGORY_BY_TYPE[type] !== 'preventiva' ? 'preventiva' : undefined,
    title: `${label} — OS ${wo.number ?? ''}`.trim(),
    description: opts.description ?? '',
    priority: opts.priority,
    actor_name: opts.actor_name ?? null,
    actor_user_id: opts.actor_user_id ?? null,
    actor_technician_id: opts.actor_technician_id ?? null,
    machine_id: wo.machine_id ?? null,
    machine_name: wo.machine_name ?? null,
    work_order_id: wo.id,
    work_order_number: wo.number ?? null,
    payload: opts.payload,
  })
}

module.exports = { notify, notifyWorkOrder }
