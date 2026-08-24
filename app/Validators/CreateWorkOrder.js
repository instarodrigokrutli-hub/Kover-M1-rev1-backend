'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateWorkOrder {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    machine_id: schema.number([rules.exists({ table: 'machines', column: 'id' })]),
    priority: schema.enum(['baixa', 'media', 'alta', 'emergencial']),
    description: schema.string({ trim: true }),
    occurrence_type: schema.enum.optional([
      'mecanica', 'eletrica', 'hidraulica', 'pneumatica',
      'instrumentacao', 'processo', 'seguranca', 'outro',
    ]),
    machine_stopped: schema.boolean.optional(),
    maintenance_type: schema.enum.optional(['corretiva', 'preventiva', 'preditiva', 'inspecao']),
  })

  messages = {
    'machine_id.exists': 'Máquina não encontrada.',
  }
}

module.exports = CreateWorkOrder
