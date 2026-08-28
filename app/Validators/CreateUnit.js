'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateUnit {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    code: schema.string({ trim: true }, [rules.regex(/^[A-Z0-9]{1,10}$/i)]),
    label: schema.string({ trim: true }, [rules.minLength(1), rules.maxLength(20)]),
    allows_decimal: schema.boolean(),
  })

  messages = {}
}

module.exports = CreateUnit
