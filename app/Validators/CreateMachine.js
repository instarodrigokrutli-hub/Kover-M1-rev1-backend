'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateMachine {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    name: schema.string({ trim: true }, [rules.maxLength(150)]),
    sector: schema.string({ trim: true }, [rules.maxLength(100)]),
    code: schema.string.optional({ trim: true }, [rules.maxLength(40)]),
    fabricante: schema.string.optional({ trim: true }),
    modelo: schema.string.optional({ trim: true }),
    serial_number: schema.string.optional({ trim: true }),
    acquired_at: schema.date.optional(),
  })

  messages = {}
}

module.exports = CreateMachine
