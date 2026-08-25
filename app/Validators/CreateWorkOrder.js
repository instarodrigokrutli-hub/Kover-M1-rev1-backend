'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateWorkOrder {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    machine_id: schema.number([rules.exists({ table: 'machines', column: 'id' })]),
    priority: schema.enum(['baixa', 'media', 'alta', 'emergencial']),
    // Turno muda com frequência — quem abre a OS informa o turno atual em
    // vez de depender do que está fixado no cadastro do usuário. Obrigatório
    // para escala 3x3 (dia/noite) e 6x1 (manhã/tarde/noite); a 5x2 comercial
    // não tem turno (horário comercial fixo da empresa) — ver checagem manual
    // no controller.
    turno: schema.enum.optional(['manha', 'tarde', 'noite', 'dia']),
    escala: schema.enum(['3x3', '6x1', '5x2']),
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
