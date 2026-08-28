'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

const SERVICE_TYPES = ['mecanico', 'eletrico', 'hidraulico', 'pneumatico', 'instrumentacao', 'lubrificacao', 'solda', 'outro']
const PERIODICITIES = [
  'diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral',
  'trimestral', 'semestral', 'anual', 'horimetro', 'quilometragem', 'ciclos',
]

class SaveMaintenancePlan {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    machine_id: schema.number([rules.exists({ table: 'machines', column: 'id' })]),
    name: schema.string({ trim: true }, [rules.minLength(3), rules.maxLength(120)]),
    description: schema.string({ trim: true }, [rules.minLength(3), rules.maxLength(2000)]),
    service_type: schema.enum(SERVICE_TYPES),
    periodicity: schema.enum(PERIODICITIES),
    periodicity_value: schema.number.optional([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
    estimated_minutes: schema.number([rules.range(1, 10000)]),
    due_days: schema.number([rules.range(1, 365)]),
    active: schema.boolean.optional(),
  })

  messages = {
    'machine_id.exists': 'Máquina não encontrada.',
  }
}

module.exports = SaveMaintenancePlan
