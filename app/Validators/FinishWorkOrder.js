'use strict'

const { schema } = use('Adonis/Core/Validator')

class FinishWorkOrder {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    service_type: schema.enum.optional([
      'mecanico', 'eletrico', 'hidraulico', 'pneumatico',
      'instrumentacao', 'lubrificacao', 'solda', 'outro',
    ]),
    final_comment: schema.string.optional({ trim: true }),
  })

  messages = {}
}

module.exports = FinishWorkOrder
