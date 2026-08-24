'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class AddWorkOrderMaterial {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    material_id: schema.number([rules.exists({ table: 'materials', column: 'id' })]),
    quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
  })

  messages = {
    'material_id.exists': 'Material não encontrado.',
  }
}

module.exports = AddWorkOrderMaterial
