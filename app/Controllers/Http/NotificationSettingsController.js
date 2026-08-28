'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/NotificationSettingsController.js
|--------------------------------------------------------------------------
|
| Configuração de Notificações por perfil (Fase 2, migrado do Supabase).
| Réplica fiel de src/lib/notification-settings.functions.ts.
|
*/

const NotificationSetting = require('../../Models/NotificationSetting')
const { assertRole } = require('../../Services/Authorization')
const SaveNotificationSetting = require('../../Validators/SaveNotificationSetting')

const NOTIFICATION_PROFILES = ['producao', 'tecnico', 'pcm', 'coordenador']
const NOTIFICATION_EVENTS = [
  'os_criada', 'os_assumida', 'os_pausada', 'os_retomada', 'os_responsavel_alterado',
  'os_concluida', 'os_reprovada', 'os_reaberta',
  'preventiva_criada', 'preventiva_iniciada', 'preventiva_concluida', 'preventiva_atrasada',
  'solicitacoes_pendentes',
]

class NotificationSettingsController {
  // GET /notification-settings
  async index(ctx) {
    assertRole(ctx, ['admin'])
    const rows = await NotificationSetting.query()

    const missing = []
    for (const perfil of NOTIFICATION_PROFILES) {
      for (const evento of NOTIFICATION_EVENTS) {
        if (!rows.some((r) => r.perfil === perfil && r.evento === evento)) {
          missing.push({ perfil, evento, receber_sistema: false, receber_push: false, prioridade: 'informativa', ativo: false })
        }
      }
    }
    if (missing.length > 0) {
      for (const m of missing) {
        const created = await NotificationSetting.create(m)
        rows.push(created)
      }
    }
    return rows.map((r) => ({
      id: r.id, perfil: r.perfil, evento: r.evento,
      receber_sistema: !!r.receber_sistema, receber_push: !!r.receber_push,
      prioridade: r.prioridade, ativo: !!r.ativo,
    }))
  }

  // POST /notification-settings
  async save(ctx) {
    assertRole(ctx, ['admin'])
    const { request } = ctx
    const data = await request.validate(SaveNotificationSetting)

    const existing = await NotificationSetting.query()
      .where('perfil', data.perfil)
      .where('evento', data.evento)
      .first()

    if (existing) {
      existing.merge(data)
      await existing.save()
    } else {
      await NotificationSetting.create(data)
    }
    return { ok: true }
  }
}

module.exports = NotificationSettingsController
