'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

const ACTIVITY_TYPES = [
  'limpeza', 'organizacao', 'lubrificacao', 'inspecao', 'fabricacao',
  'ajuste', 'apoio_producao', 'soldagem', 'outro',
]

class CreateTechActivityRoute {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    items: schema.array([rules.minLength(2), rules.maxLength(30)]).members(
      schema.object().members({
        machine_name: schema.string({ trim: true }, [rules.minLength(1)]),
        start_at: schema.string(),
        end_at: schema.string(),
      })
    ),
    sector: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(80)]),
    activity_type: schema.enum(ACTIVITY_TYPES),
    description: schema.string({ trim: true }, [rules.minLength(3), rules.maxLength(500)]),
    notes: schema.string.optional({ trim: true }, [rules.maxLength(500)]),
  })

  messages = {}
}

module.exports = CreateTechActivityRoute
