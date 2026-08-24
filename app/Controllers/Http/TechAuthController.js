'use strict'

const { DateTime } = require('luxon')
const Technician = require('../../Models/Technician')
const TechnicianSession = require('../../Models/TechnicianSession')
const TechnicianCode = require('../../Services/TechnicianCode')
const SessionToken = require('../../Services/SessionToken')
const AuditLogger = require('../../Services/AuditLogger')
const { COOKIE_NAME, ABSOLUTE_TTL_HOURS } = require('../../Middleware/TechAuth')

class TechAuthController {
  // GET /tech/technicians (público — só id/nome dos ativos, pra tela de login)
  async listActive() {
    const technicians = await Technician.query()
      .where('status', 'ativo')
      .orderBy('name', 'asc')
      .select(['id', 'name'])
    return technicians
  }

  // POST /tech/login
  async login({ request, response }) {
    const { technician_id, code } = request.only(['technician_id', 'code'])

    const technician = await Technician.find(technician_id)
    if (!technician || technician.status !== 'ativo') {
      return response.status(401).json({ message: 'Técnico não encontrado ou inativo.' })
    }

    if (!TechnicianCode.verify(code, technician.code_hash)) {
      await AuditLogger.log(
        { technician, request },
        { action: 'TECH_LOGIN_FAILED', entityType: 'technicians', entityId: technician.id }
      )
      return response.status(401).json({ message: 'Código incorreto.' })
    }

    const token = SessionToken.generate()
    const now = DateTime.local()

    await TechnicianSession.create({
      technician_id: technician.id,
      token_hash: SessionToken.hashToken(token),
      expires_at: now.plus({ hours: ABSOLUTE_TTL_HOURS }),
      last_activity_at: now,
      ip: request.ip(),
      user_agent: request.header('user-agent') || null,
    })

    await AuditLogger.log(
      { technician, request },
      { action: 'TECH_LOGIN', entityType: 'technicians', entityId: technician.id }
    )

    response.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      maxAge: ABSOLUTE_TTL_HOURS * 3600,
    })

    return { technician }
  }

  // POST /tech/logout
  async logout(ctx) {
    const { response, technicianSession, technician } = ctx
    technicianSession.revoked_at = DateTime.local()
    await technicianSession.save()

    await AuditLogger.log(ctx, {
      action: 'TECH_LOGOUT',
      entityType: 'technicians',
      entityId: technician.id,
    })

    response.clearCookie(COOKIE_NAME)
    return { message: 'Sessão encerrada.' }
  }

  // GET /tech/me
  async me({ technician }) {
    return technician
  }
}

module.exports = TechAuthController
