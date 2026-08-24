'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateCategory {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    name: schema.string({ trim: true }, [
      rules.maxLength(120),
      rules.unique({ table: 'categories', column: 'name' }),
    ]),
  })

  messages = {
    'name.unique': 'Já existe uma categoria com este nome.',
  }
}

module.exports = CreateCategory
