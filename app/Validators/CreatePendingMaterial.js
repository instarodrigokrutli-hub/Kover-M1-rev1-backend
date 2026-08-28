'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreatePendingMaterial {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    description: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(200)]),
    quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
    unit: schema.string({ trim: true }, [rules.maxLength(10)]),
    destination: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(200)]),
    category_hint: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    usage_date: schema.date.optional(),
    notes: schema.string.optional({ trim: true }, [rules.maxLength(300)]),
  })

  messages = {}
}

module.exports = CreatePendingMaterial
