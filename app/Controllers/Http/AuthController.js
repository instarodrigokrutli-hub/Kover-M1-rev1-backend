'use strict'

const Hash = use('Adonis/Core/Hash')
const User = require('../../Models/User')
const UserRole = require('../../Models/UserRole')
const Jwt = require('../../Services/Jwt')
const AuditLogger = require('../../Services/AuditLogger')
const LoginUser = require('../../Validators/LoginUser')
const ChangePassword = require('../../Validators/ChangePassword')
const UpdateMyTurno = require('../../Validators/UpdateMyTurno')

class AuthController {
  // POST /auth/login
  async login({ request, response }) {
    const { identifier, password } = await request.validate(LoginUser)

    const normalized = identifier.trim().toLowerCase()
    const user = await User.query()
      .whereRaw('lower(email) = ?', [normalized])
      .orWhereRaw('lower(username) = ?', [normalized])
      .preload('roles')
      .first()

    if (!user) {
      return response.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const validPassword = await Hash.verify(user.password_hash, password)
    if (!validPassword) {
      return response.status(401).json({ message: 'Credenciais inválidas.' })
    }

    if (user.banned || user.status !== 'ativo') {
      return response.status(401).json({ message: 'Usuário inativo ou bloqueado.' })
    }

    const token = Jwt.sign(user.id)
    return response.json({ token, user })
  }

  // POST /auth/claim-first-admin
  // Bootstrap: enquanto não existir NENHUM admin no sistema, este endpoint
  // fica aberto para criar o primeiro (equivalente ao claimFirstAdmin()
  // do sistema de referência, adaptado já que aqui não há cadastro
  // público prévio via Supabase Auth).
  async claimFirstAdmin({ request, response }) {
    const existingAdmin = await UserRole.query().where('role', 'admin').first()
    if (existingAdmin) {
      return response.status(403).json({ message: 'Já existe um administrador cadastrado.' })
    }

    const { email, password, full_name } = request.only(['email', 'password', 'full_name'])
    if (!email || !password || !full_name) {
      return response.status(422).json({ message: 'email, password e full_name são obrigatórios.' })
    }

    const passwordHash = await Hash.make(password)
    const user = await User.create({
      email,
      password_hash: passwordHash,
      full_name,
      status: 'ativo',
    })
    await UserRole.create({ user_id: user.id, role: 'admin' })

    await AuditLogger.log(
      { user, request },
      { action: 'ADMIN_CLAIMED', entityType: 'users', entityId: user.id }
    )

    const token = Jwt.sign(user.id)
    return response.status(201).json({ token, user })
  }

  // GET /auth/me
  async me({ user }) {
    return user
  }

  // PATCH /auth/password — troca a própria senha (qualquer papel autenticado).
  async changePassword({ request, response, user }) {
    const { current_password, new_password } = await request.validate(ChangePassword)

    const validPassword = await Hash.verify(user.password_hash, current_password)
    if (!validPassword) {
      return response.status(401).json({ message: 'Senha atual incorreta.' })
    }

    user.password_hash = await Hash.make(new_password)
    await user.save()

    await AuditLogger.log({ user, request }, { action: 'PASSWORD_CHANGED', entityType: 'users', entityId: user.id })

    return response.json({ ok: true })
  }

  // PATCH /auth/turno — o próprio usuário de produção define/atualiza seu
  // turno (troca com frequência, por isso não é fixado na criação da conta).
  async updateMyTurno({ request, response, user }) {
    const { turno } = await request.validate(UpdateMyTurno)
    user.turno = turno
    await user.save()

    await AuditLogger.log({ user, request }, { action: 'TURNO_UPDATED', entityType: 'users', entityId: user.id, details: { turno } })

    return response.json({ ok: true, turno })
  }
}

module.exports = AuthController
