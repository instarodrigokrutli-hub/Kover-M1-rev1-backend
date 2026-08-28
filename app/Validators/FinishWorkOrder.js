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
    // técnico, obrigatória ao concluir uma OS corretiva (alimenta o
    // indicador de OS). Não se aplica a preventivas — a obrigatoriedade é
    // reforçada no controller, que conhece o maintenance_type da OS.
    corrective_classification: schema.enum.optional(['corretiva', 'corretiva_programada']),
  })

  messages = {}
}

module.exports = FinishWorkOrder
