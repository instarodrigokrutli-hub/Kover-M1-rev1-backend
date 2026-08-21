'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class CreateOrdemServico {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    numero: schema.string({ trim: true }, [
      rules.maxLength(30),
      rules.unique({ table: 'ordens_servicos', column: 'numero' }),
    ]),
    titulo: schema.string({ trim: true }, [rules.maxLength(150)]),
    descricao: schema.string.optional({ trim: true }),
    status: schema.enum.optional(['aberta', 'em_andamento', 'concluida', 'cancelada']),
    prioridade: schema.enum.optional(['baixa', 'media', 'alta', 'urgente']),
    tecnico_id: schema.number.optional([rules.exists({ table: 'tecnicos', column: 'id' })]),
    data_abertura: schema.date(),
  })

  messages = {
    'numero.required': 'Informe o número da OS.',
    'numero.unique': 'Já existe uma OS com esse número.',
    'titulo.required': 'Informe o título da OS.',
    'tecnico_id.exists': 'Técnico informado não existe.',
    'data_abertura.required': 'Informe a data de abertura.',
  }
}

module.exports = CreateOrdemServico
