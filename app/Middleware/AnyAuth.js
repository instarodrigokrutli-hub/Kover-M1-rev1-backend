'use strict'

const Auth = require('./Auth')
const TechAuth = require('./TechAuth')

/*
|--------------------------------------------------------------------------
| app/Middleware/AnyAuth.js
|--------------------------------------------------------------------------
|
| Alguns recursos (ex.: materiais) são lidos tanto por usuários
| (admin/coordenador/produção, via JWT) quanto por técnicos (via cookie
| de sessão) — este middleware aceita qualquer um dos dois, populando
| ctx.user OU ctx.technician conforme o caso. 401 só se nenhum dos dois
| mecanismos autenticar.
|
*/
class AnyAuth {
  async handle(ctx, next) {
    const header = ctx.request.header('authorization') || ''
    const hasBearer = header.startsWith('Bearer ')
    const hasTechCookie = !!ctx.request.cookie(TechAuth.COOKIE_NAME)

    if (hasBearer) {
      return new Auth().handle(ctx, next)
    }
    if (hasTechCookie) {
      return new TechAuth().handle(ctx, next)
    }

    return ctx.response.status(401).json({ message: 'Não autenticado.' })
  }
}

module.exports = AnyAuth
