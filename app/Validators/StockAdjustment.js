'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class StockAdjustment {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    material_id: schema.number([rules.exists({ table: 'materials', column: 'id' })]),
    type: schema.enum(['ajuste_entrada', 'ajuste_saida']),
    quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
    nf_number: schema.string.optional({ trim: true }),
    oc_number: schema.string.optional({ trim: true }),
    justification: schema.string.optional({ trim: true }, [rules.minLength(10)]),
  })

  messages = {
    'material_id.exists': 'Material não encontrado.',
    'justification.minLength': 'Justificativa deve ter pelo menos 10 caracteres.',
  }
}

module.exports = StockAdjustment
