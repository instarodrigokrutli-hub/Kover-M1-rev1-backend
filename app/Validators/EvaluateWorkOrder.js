'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class EvaluateWorkOrder {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    approved: schema.boolean(),
    comment: schema.string.optional({ trim: true }),
    reason: schema.string.optional({ trim: true }, [rules.minLength(5)]),
  })

  messages = {
    'reason.minLength': 'Motivo da reprovação deve ter pelo menos 5 caracteres.',
  }
}

module.exports = EvaluateWorkOrder
