'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class UpdateUnit {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    code: schema.string({ trim: true }, [rules.minLength(1), rules.maxLength(10)]),
    label: schema.string({ trim: true }, [rules.minLength(1), rules.maxLength(20)]),
    allows_decimal: schema.boolean(),
    active: schema.boolean(),
  })

  messages = {}
}

module.exports = UpdateUnit
