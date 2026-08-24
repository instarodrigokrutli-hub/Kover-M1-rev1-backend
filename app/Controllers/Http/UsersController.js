'use strict'

const Hash = use('Adonis/Core/Hash')
const User = require('../../Models/User')
const UserRole = require('../../Models/UserRole')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreateManagedUser = require('../../Validators/CreateManagedUser')
const UpdateManagedUser = require('../../Validators/UpdateManagedUser')

const PRODUCAO_EMAIL_DOMAIN = 'producao.local'

class UsersController {
  // GET /users
  async index(ctx) {
    assertRole(ctx, ['admin'])
    const users = await User.query().preload('roles').orderBy('full_name', 'asc')
    return users
  }

  // POST /users
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response } = ctx
    const data = await request.validate(CreateManagedUser)

    let email = data.email
    if (data.role === 'producao') {
      if (!data.username || !data.sector_id || !data.turno) {
        return response
          .status(422)
          .json({ message: 'Produção exige username, sector_id e turno.' })
      }
      email = `${data.username}@${PRODUCAO_EMAIL_DOMAIN}`
    } else if (!data.email || !data.password) {
      return response.status(422).json({ message: 'admin/coordenador exigem email e password.' })
    }

    const passwordHash = await Hash.make(data.password || Math.random().toString(36).slice(2))

    const user = await User.create({
      email,
      username: data.username || null,
      password_hash: passwordHash,
      full_name: data.full_name,
      cargo: data.cargo || null,
      matricula: data.matricula || null,
      sector_id: data.sector_id || null,
      turno: data.turno || null,
      status: 'ativo',
    })
    await UserRole.create({ user_id: user.id, role: data.role })

    await AuditLogger.log(ctx, { action: 'USER_CREATED', entityType: 'users', entityId: user.id })

    await user.load('roles')
    return response.status(201).json(user)
  }

  // PUT /users/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response } = ctx
    const data = await request.validate(UpdateManagedUser)

    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado.' })
    }

    if (data.new_password) {
      user.password_hash = await Hash.make(data.new_password)
    }
    user.merge({
      full_name: data.full_name ?? user.full_name,
      status: data.status ?? user.status,
      cargo: data.cargo ?? user.cargo,
      matricula: data.matricula ?? user.matricula,
      sector_id: data.sector_id ?? user.sector_id,
      turno: data.turno ?? user.turno,
    })
    await user.save()

    await AuditLogger.log(ctx, { action: 'USER_UPDATED', entityType: 'users', entityId: user.id })

    await user.load('roles')
    return user
  }

  // PATCH /users/:id/role
  async setRole(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user: caller } = ctx
    const { role, enabled } = request.only(['role', 'enabled'])

    if (Number(params.id) === caller.id && role === 'admin' && enabled === false) {
      return response.status(422).json({ message: 'Você não pode revogar seu próprio acesso de admin.' })
    }

    if (role === 'admin' && enabled === false) {
      const admins = await UserRole.query().where('role', 'admin')
      if (admins.length <= 1) {
        return response.status(422).json({ message: 'Não é possível remover o último administrador.' })
      }
    }

    const existing = await UserRole.query()
      .where('user_id', params.id)
      .where('role', role)
      .first()

    if (enabled && !existing) {
      await UserRole.create({ user_id: params.id, role })
    } else if (!enabled && existing) {
      await existing.delete()
    }

    await AuditLogger.log(ctx, {
      action: enabled ? 'ROLE_GRANT' : 'ROLE_REVOKE',
      entityType: 'users',
      entityId: params.id,
      details: { role },
    })

    const user = await User.query().where('id', params.id).preload('roles').first()
    return user
  }
}

module.exports = UsersController
