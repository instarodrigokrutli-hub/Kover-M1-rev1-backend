'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/UserNotificationPreferencesController.js
|--------------------------------------------------------------------------
|
| Preferência PESSOAL de quais tipos de evento aparecem na Central de
| Notificações do usuário logado — complementa (não substitui)
| NotificationSettingsController, que é por perfil e só o PCM mexe.
| Aqui qualquer usuário com acesso à central (admin/coordenador) mexe só
| na própria preferência.
|
*/

const UserNotificationPreference = require('../../Models/UserNotificationPreference')
const { assertRole } = require('../../Services/Authorization')

const NOTIFICATION_EVENTS = [
  'os_criada', 'os_assumida', 'os_pausada', 'os_retomada', 'os_responsavel_alterado',
  'os_concluida', 'os_reprovada', 'os_reaberta',
  'preventiva_criada', 'preventiva_iniciada', 'preventiva_concluida', 'preventiva_atrasada',
  'solicitacoes_pendentes',
]

class UserNotificationPreferencesController {
  // GET /notification-preferences/mine
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const rows = await UserNotificationPreference.query().where('user_id', ctx.user.id)
    const byEvent = new Map(rows.map((r) => [r.evento, !!r.ativo]))
    return NOTIFICATION_EVENTS.map((evento) => ({
      evento,
      ativo: byEvent.has(evento) ? byEvent.get(evento) : true,
    }))
  }

  // POST /notification-preferences/mine  { evento, ativo }
  async save(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request, response, user } = ctx
    const { evento, ativo } = request.only(['evento', 'ativo'])

    if (!NOTIFICATION_EVENTS.includes(evento)) {
      return response.status(422).json({ message: 'Evento inválido.' })
    }

    const existing = await UserNotificationPreference.query()
      .where('user_id', user.id).where('evento', evento).first()
    if (existing) {
      existing.merge({ ativo: !!ativo })
      await existing.save()
    } else {
      await UserNotificationPreference.create({ user_id: user.id, evento, ativo: !!ativo })
    }
    return { ok: true }
  }
}

module.exports = UserNotificationPreferencesController
