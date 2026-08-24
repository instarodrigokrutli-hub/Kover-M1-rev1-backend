'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateManagedUser {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    role: schema.enum(['admin', 'coordenador', 'producao']),
    full_name: schema.string({ trim: true }, [rules.maxLength(150)]),
    email: schema.string.optional({ trim: true }, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
    password: schema.string.optional({}, [rules.minLength(6)]),
    username: schema.string.optional(
      { trim: true },
      [rules.regex(/^[a-z0-9]+([a-z0-9._-]*[a-z0-9])?$/), rules.unique({ table: 'users', column: 'username' })]
    ),
    sector_id: schema.number.optional([rules.exists({ table: 'sectors', column: 'id' })]),
    turno: schema.enum.optional(['manha', 'tarde', 'noite']),
    cargo: schema.string.optional({ trim: true }),
    matricula: schema.string.optional({ trim: true }),
    status: schema.enum.optional(['ativo', 'inativo']),
  })

  messages = {
    'email.unique': 'Já existe um usuário com este e-mail.',
    'username.unique': 'Já existe um usuário com este nome de usuário.',
    'sector_id.exists': 'Setor não encontrado.',
  }
}

module.exports = CreateManagedUser
