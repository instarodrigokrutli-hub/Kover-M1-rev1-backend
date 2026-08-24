'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

const UNIT_CODES = [
  'UN', 'PC', 'CJ', 'PAR', 'MM', 'CM', 'M', 'M2', 'M3', 'POL',
  'KG', 'G', 'L', 'ML', 'CX', 'RL', 'SC', 'BD', 'LT', 'PCT',
]

class UpdateMaterial {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    name: schema.string.optional({ trim: true }, [rules.maxLength(150)]),
    category_id: schema.number.optional([rules.exists({ table: 'categories', column: 'id' })]),
    unit: schema.enum.optional(UNIT_CODES),
    unit_value: schema.number.optional(),
    min_quantity: schema.number.optional(),
    notes: schema.string.optional({ trim: true }),
    status: schema.enum.optional(['ativo', 'inativo']),
  })

  messages = {
    'category_id.exists': 'Categoria não encontrada.',
  }
}

module.exports = UpdateMaterial
