'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class UpdateManagedUser {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    full_name: schema.string.optional({ trim: true }, [rules.maxLength(150)]),
    new_password: schema.string.optional({}, [rules.minLength(6)]),
    status: schema.enum.optional(['ativo', 'inativo']),
    cargo: schema.string.optional({ trim: true }),
    matricula: schema.string.optional({ trim: true }),
    sector_id: schema.number.optional([rules.exists({ table: 'sectors', column: 'id' })]),
    turno: schema.enum.optional(['manha', 'tarde', 'noite']),
  })

  messages = {
    'sector_id.exists': 'Setor não encontrado.',
  }
}

module.exports = UpdateManagedUser
