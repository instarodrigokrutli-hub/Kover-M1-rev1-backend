'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateTechnician {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    name: schema.string({ trim: true }, [rules.maxLength(120)]),
    code: schema.string({}, [rules.regex(/^\d{4,12}$/)]),
  })

  messages = {
    'name.required': 'Informe o nome do técnico.',
    'code.regex': 'O código deve ter entre 4 e 12 dígitos numéricos.',
  }
}

module.exports = CreateTechnician
