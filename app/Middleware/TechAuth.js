'use strict'

const { DateTime } = require('luxon')
const TechnicianSession = require('../Models/TechnicianSession')
const Technician = require('../Models/Technician')
const SessionToken = require('../Services/SessionToken')
const AuditLogger = require('../Services/AuditLogger')

const ABSOLUTE_TTL_HOURS = 8
const INACTIVITY_TIMEOUT_HOURS = 2
const COOKIE_NAME = 'tech_sid'

/*
|--------------------------------------------------------------------------
| app/Middleware/TechAuth.js
|--------------------------------------------------------------------------
|
| Sessão de técnico por cookie httpOnly. TTL absoluto de 8h desde o login
| + timeout de inatividade de 2h com sliding window (cada requisição
| autenticada renova last_activity_at) — réplica de
| requireTechnicianFromCookie() do sistema de referência.
|
*/
class TechAuth {
  async handle(ctx, next) {
    const token = ctx.request.cookie(COOKIE_NAME)
    if (!token) {
      return ctx.response.status(401).json({ message: 'Sessão de técnico não encontrada.' })
    }

    const tokenHash = SessionToken.hashToken(token)
    const session = await TechnicianSession.query()
      .where('token_hash', tokenHash)
      .whereNull('revoked_at')
      .first()

    if (!session) {
      ctx.response.clearCookie(COOKIE_NAME)
      return ctx.response.status(401).json({ message: 'Sessão inválida.' })
    }

    const now = DateTime.local()

    if (now > session.expires_at) {
      session.revoked_at = now
      await session.save()
      ctx.response.clearCookie(COOKIE_NAME)
      return ctx.response.status(401).json({ message: 'Sessão expirada.' })
    }

    const inactiveHours = now.diff(session.last_activity_at, 'hours').hours
    if (inactiveHours > INACTIVITY_TIMEOUT_HOURS) {
      session.revoked_at = now
      await session.save()
      await AuditLogger.log(
        { technician: { id: session.technician_id }, request: ctx.request },
        { action: 'TECH_LOGOUT_INACTIVITY', entityType: 'technician_sessions', entityId: session.id }
      )
      ctx.response.clearCookie(COOKIE_NAME)
      return ctx.response.status(401).json({ message: 'Sessão encerrada por inatividade.' })
    }

    const technician = await Technician.find(session.technician_id)
    if (!technician || technician.status !== 'ativo') {
      return ctx.response.status(401).json({ message: 'Técnico inativo.' })
    }

    session.last_activity_at = now
    await session.save()

    ctx.technician = technician
    ctx.technicianSession = session
    await next()
  }
}

TechAuth.COOKIE_NAME = COOKIE_NAME
TechAuth.ABSOLUTE_TTL_HOURS = ABSOLUTE_TTL_HOURS

module.exports = TechAuth
