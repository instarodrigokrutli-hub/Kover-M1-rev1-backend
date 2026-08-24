'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class UpdateTechnician {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    name: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    new_code: schema.string.optional({}, [rules.regex(/^\d{4,12}$/)]),
  })

  messages = {
    'new_code.regex': 'O código deve ter entre 4 e 12 dígitos numéricos.',
  }
}

module.exports = UpdateTechnician
