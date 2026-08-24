'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateSector {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    name: schema.string({ trim: true }, [
      rules.maxLength(120),
      rules.unique({ table: 'sectors', column: 'name' }),
    ]),
  })

  messages = {
    'name.unique': 'Já existe um setor com este nome.',
  }
}

module.exports = CreateSector
