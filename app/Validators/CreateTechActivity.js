'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

const ACTIVITY_TYPES = [
  'limpeza', 'organizacao', 'lubrificacao', 'inspecao', 'fabricacao',
  'ajuste', 'apoio_producao', 'soldagem', 'outro',
]

class CreateTechActivity {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    start_at: schema.string(),
    end_at: schema.string(),
    machine_id: schema.number.optional([rules.exists({ table: 'machines', column: 'id' })]),
    machine_name: schema.string.optional({ trim: true }),
    sector: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(80)]),
    activity_type: schema.enum(ACTIVITY_TYPES),
    description: schema.string({ trim: true }, [rules.minLength(3), rules.maxLength(500)]),
    notes: schema.string.optional({ trim: true }, [rules.maxLength(500)]),
  })

  messages = {
    'machine_id.exists': 'Máquina não encontrada.',
  }
}

module.exports = CreateTechActivity
