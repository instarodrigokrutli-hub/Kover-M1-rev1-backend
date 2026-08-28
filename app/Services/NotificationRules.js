'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/NotificationRules.js
|--------------------------------------------------------------------------
|
| Réplica de src/lib/notification-settings.server.ts — lê as regras
| configuradas pelo PCM (notification_settings) para um evento.
|
*/

const NotificationSetting = require('../Models/NotificationSetting')
const { PRIORITY_RANK } = require('./NotificationConstants')

async function getEventRules(evento) {
  const empty = { systemProfiles: [], pushProfiles: [], priority: null, configured: false }
  try {
    const rows = await NotificationSetting.query().where('evento', evento)
    if (!rows.length) return empty

    const active = rows.filter((r) => r.ativo)
    const systemProfiles = active.filter((r) => r.receber_sistema).map((r) => r.perfil)
    const pushProfiles = active.filter((r) => r.receber_push).map((r) => r.perfil)
    let priority = null
    for (const r of active) {
      if (!r.receber_sistema && !r.receber_push) continue
      if (!priority || PRIORITY_RANK[r.prioridade] > PRIORITY_RANK[priority]) priority = r.prioridade
    }
    return { systemProfiles, pushProfiles, priority, configured: true }
  } catch (e) {
    console.error('[notification-settings]', e)
    return empty
  }
}

module.exports = { getEventRules }
