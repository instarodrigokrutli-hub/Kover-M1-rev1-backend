'use strict'

const AuditLog = require('../Models/AuditLog')

/*
|--------------------------------------------------------------------------
| app/Services/AuditLogger.js
|--------------------------------------------------------------------------
|
| Helper único para gravar audit_logs a partir de qualquer controller,
| identificando o ator (usuário logado ou técnico) a partir do ctx.
|
*/

async function log(ctx, { action, entityType = null, entityId = null, details = null }) {
  await AuditLog.create({
    action,
    actor_user_id: ctx.user ? ctx.user.id : null,
    actor_technician_id: ctx.technician ? ctx.technician.id : null,
    actor_role: ctx.user ? 'user' : ctx.technician ? 'technician' : null,
    entity_type: entityType,
    entity_id: entityId !== null && entityId !== undefined ? String(entityId) : null,
    ip: ctx.request.ip(),
    user_agent: ctx.request.header('user-agent') || null,
    details,
  })
}

module.exports = { log }
