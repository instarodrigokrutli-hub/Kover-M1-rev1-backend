'use strict'

const Schema = use('Adonis/Lucid/Schema')

class NotificationSettingsSchema extends Schema {
  up() {
    this.schema.createTable('notification_settings', (table) => {
      table.increments('id')
      table.enu('perfil', ['producao', 'tecnico', 'pcm', 'coordenador']).notNullable()
      table
        .enu('evento', [
          'os_criada', 'os_assumida', 'os_pausada', 'os_retomada', 'os_responsavel_alterado',
          'os_concluida', 'os_reprovada', 'os_reaberta',
          'preventiva_criada', 'preventiva_iniciada', 'preventiva_concluida', 'preventiva_atrasada',
          'solicitacoes_pendentes',
        ])
        .notNullable()
      table.boolean('receber_sistema').notNullable().defaultTo(true)
      table.boolean('receber_push').notNullable().defaultTo(false)
      table.enu('prioridade', ['critica', 'importante', 'informativa']).notNullable().defaultTo('informativa')
      table.boolean('ativo').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.unique(['perfil', 'evento'])
    })
  }

  down() {
    this.schema.dropTable('notification_settings')
  }
}

module.exports = NotificationSettingsSchema
