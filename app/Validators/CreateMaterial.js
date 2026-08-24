'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

const UNIT_CODES = [
  'UN', 'PC', 'CJ', 'PAR', 'MM', 'CM', 'M', 'M2', 'M3', 'POL',
  'KG', 'G', 'L', 'ML', 'CX', 'RL', 'SC', 'BD', 'LT', 'PCT',
]

class CreateMaterial {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    code: schema.string.optional({ trim: true }, [rules.maxLength(40)]),
    name: schema.string({ trim: true }, [rules.maxLength(150)]),
    category_id: schema.number([rules.exists({ table: 'categories', column: 'id' })]),
    unit: schema.enum(UNIT_CODES),
    unit_value: schema.number.optional(),
    min_quantity: schema.number.optional(),
    notes: schema.string.optional({ trim: true }),
  })

  messages = {
    'category_id.exists': 'Categoria não encontrada.',
  }
}

module.exports = CreateMaterial
