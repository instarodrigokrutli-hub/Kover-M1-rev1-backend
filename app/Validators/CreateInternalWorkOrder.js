'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateInternalWorkOrder {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    machine_id: schema.number.optional([rules.exists({ table: 'machines', column: 'id' })]),
    machine_name: schema.string.optional({ trim: true }),
    sector: schema.string({ trim: true }, [rules.maxLength(100)]),
    service_type: schema.enum([
      'mecanico', 'eletrico', 'pneumatico', 'hidraulico', 'eletronico',
      'instrumentacao', 'lubrificacao', 'soldagem', 'outro',
    ]),
    description: schema.string({ trim: true }),
    technician_comment: schema.string.optional({ trim: true }),
    started_at: schema.date.optional(),
    finished_at: schema.date.optional(),
    materials: schema.array.optional().members(
      schema.object().members({
        material_id: schema.number([rules.exists({ table: 'materials', column: 'id' })]),
        quantity: schema.number([rules.range(0.0001, Number.MAX_SAFE_INTEGER)]),
      })
    ),
  })

  messages = {
    'machine_id.exists': 'Máquina não encontrada.',
  }
}

module.exports = CreateInternalWorkOrder
