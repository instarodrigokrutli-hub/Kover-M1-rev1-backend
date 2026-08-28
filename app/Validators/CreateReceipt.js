'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateReceipt {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    supplier_id: schema.number([rules.exists({ table: 'suppliers', column: 'id' })]),
    nf_number: schema.string({ trim: true }, [rules.minLength(1), rules.maxLength(60)]),
    oc_number: schema.string.optional({ trim: true }, [rules.maxLength(60)]),
    received_at: schema.date.optional(),
    notes: schema.string.optional({ trim: true }, [rules.maxLength(500)]),
    items: schema.array([rules.minLength(1), rules.maxLength(200)]).members(
      schema.object().members({
        material_id: schema.number([rules.exists({ table: 'materials', column: 'id' })]),
        quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
        unit_value: schema.number([rules.range(0, Number.MAX_SAFE_INTEGER)]),
        observation: schema.string.optional({ trim: true }, [rules.maxLength(300)]),
      })
    ),
  })

  messages = {
    'supplier_id.exists': 'Fornecedor não encontrado.',
    'items.*.material_id.exists': 'Material não encontrado.',
  }
}

module.exports = CreateReceipt
