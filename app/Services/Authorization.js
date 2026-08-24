'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/Authorization.js
|--------------------------------------------------------------------------
|
| Checagem de papel centralizada — no sistema de referência isso era
| reimplementado ad-hoc em cada arquivo de servidor; aqui vira um único
| helper reaproveitado pelos controllers.
|
*/

class ForbiddenError extends Error {
  constructor(message = 'Acesso negado.') {
    super(message)
    this.status = 403
  }
}

function hasRole(ctx, roles) {
  const userRoles = (ctx.user && ctx.user.roles) || []
  return userRoles.some((r) => roles.includes(r.role))
}

function assertRole(ctx, roles) {
  if (!hasRole(ctx, roles)) {
    throw new ForbiddenError()
  }
}

module.exports = { hasRole, assertRole, ForbiddenError }
