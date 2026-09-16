'use strict'

const Schema = use('Adonis/Lucid/Schema')

// Preferência PESSOAL (por usuário) de quais tipos de evento aparecem na sua
// própria Central de Notificações — complementa (não substitui) a
// configuração por perfil em notification_settings, que continua decidindo
// receber_sistema/receber_push/prioridade pra todo o perfil. Aqui é só um
// "não quero ver isso" individual. Ausência de linha = evento visível
// (padrão ligado).
class UserNotificationPreferencesSchema extends Schema {
  up() {
    this.schema.createTable('user_notification_preferences', (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('cascade')
        .notNullable()
      table.string('evento', 60).notNullable()
      table.boolean('ativo').notNullable().defaultTo(true)
      table.timestamps()

      table.unique(['user_id', 'evento'])
    })
  }

  down() {
    this.schema.dropTable('user_notification_preferences')
  }
}

module.exports = UserNotificationPreferencesSchema
