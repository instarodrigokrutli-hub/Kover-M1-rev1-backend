'use strict'

const AuditLog = require('../../Models/AuditLog')
const { assertRole } = require('../../Services/Authorization')

class AuditLogsController {
  // GET /audit-logs — admin/coordenador only. Histórico geral de ações do
  // sistema (quem fez o quê, quando) — tudo que os controllers já registram
  // via AuditLogger.log() em cada ação de escrita.
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { page = 1, perPage = 50, action, entity_type, from, to } = request.qs()

    const query = AuditLog.query()
      .preload('actorUser')
      .preload('actorTechnician')
      .orderBy('created_at', 'desc')

    if (action) query.where('action', action)
    if (entity_type) query.where('entity_type', entity_type)
    if (from) query.where('created_at', '>=', `${from} 00:00:00`)
    if (to) query.where('created_at', '<=', `${to} 23:59:59`)

    return query.paginate(page, perPage)
  }
}

module.exports = AuditLogsController
