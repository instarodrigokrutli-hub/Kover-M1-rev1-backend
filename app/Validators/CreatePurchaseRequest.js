'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreatePurchaseRequest {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    material_name: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(120)]),
    description: schema.string.optional({ trim: true }, [rules.maxLength(500)]),
    quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
    unit: schema.string({ trim: true }, [rules.maxLength(10)]),
    destination: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(200)]),
    machine: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    priority: schema.enum.optional(['baixa', 'media', 'alta', 'urgente']),
  })

  messages = {}
}

module.exports = CreatePurchaseRequest
