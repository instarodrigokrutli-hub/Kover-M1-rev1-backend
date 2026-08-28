'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class RegisterInitialInventoryEntry {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    material_id: schema.number([rules.exists({ table: 'materials', column: 'id' })]),
    quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
    unit_value: schema.number([rules.range(0, Number.MAX_SAFE_INTEGER)]),
    observation: schema.string({ trim: true }, [rules.minLength(10), rules.maxLength(500)]),
  })

  messages = {
    'material_id.exists': 'Material não encontrado.',
  }
}

module.exports = RegisterInitialInventoryEntry
