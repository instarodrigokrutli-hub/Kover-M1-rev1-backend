'use strict'

const { schema } = use('Adonis/Core/Validator')

class FinishWorkOrder {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    service_type: schema.enum.optional([
      'mecanico', 'eletrico', 'hidraulico', 'pneumatico',
      'instrumentacao', 'lubrificacao', 'solda', 'outro',
    ]),
    final_comment: schema.string.optional({ trim: true }),
    // Classificação Corretiva x Corretiva Programada — decidida só pelo
    // técnico, obrigatória ao concluir (alimenta o indicador de OS).
    corrective_classification: schema.enum(['corretiva', 'corretiva_programada']),
  })

  messages = {
    'corrective_classification.required': 'Classifique a OS como Corretiva ou Corretiva Programada.',
  }
}

module.exports = FinishWorkOrder
