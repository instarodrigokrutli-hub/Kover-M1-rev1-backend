'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class SaveNotificationSetting {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    perfil: schema.enum(['producao', 'tecnico', 'pcm', 'coordenador']),
    evento: schema.enum([
      'os_criada', 'os_assumida', 'os_pausada', 'os_retomada', 'os_responsavel_alterado',
      'os_concluida', 'os_reprovada', 'os_reaberta',
      'preventiva_criada', 'preventiva_iniciada', 'preventiva_concluida', 'preventiva_atrasada',
      'solicitacoes_pendentes',
    ]),
    receber_sistema: schema.boolean(),
    receber_push: schema.boolean(),
    prioridade: schema.enum(['critica', 'importante', 'informativa']),
    ativo: schema.boolean(),
  })

  messages = {}
}

module.exports = SaveNotificationSetting
