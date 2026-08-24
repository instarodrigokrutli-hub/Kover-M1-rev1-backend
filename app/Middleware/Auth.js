'use strict'

const User = require('../Models/User')
const Jwt = require('../Services/Jwt')

/*
|--------------------------------------------------------------------------
| app/Middleware/Auth.js
|--------------------------------------------------------------------------
|
| Autenticação via JWT para admin/coordenador/produção. Lê
| "Authorization: Bearer <token>", carrega o usuário + papéis e injeta
| em ctx.user. Substitui o Supabase Auth (getClaims).
|
*/
class Auth {
  async handle(ctx, next) {
    const header = ctx.request.header('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return ctx.response.status(401).json({ message: 'Não autenticado.' })
    }

    const userId = Jwt.verify(token)
    if (!userId) {
      return ctx.response.status(401).json({ message: 'Sessão inválida ou expirada.' })
    }

    const user = await User.query().where('id', userId).preload('roles').first()
    if (!user || user.banned || user.status !== 'ativo') {
      return ctx.response.status(401).json({ message: 'Usuário inativo ou bloqueado.' })
    }

    ctx.user = user
    await next()
  }
}

module.exports = Auth
