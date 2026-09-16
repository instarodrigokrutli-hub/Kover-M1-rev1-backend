'use strict'

const Schema = use('Adonis/Lucid/Schema')

// Estado de leitura/exclusão POR USUÁRIO — antes "lido" e "excluído" eram
// globais (uma notificação lida por um Coordenador desaparecia como não-lida
// pra todo mundo). Cada usuário tem sua própria linha aqui; ausência de linha
// = não lida, não excluída (estado padrão).
class UserNotificationStatesSchema extends Schema {
  up() {
    this.schema.createTable('user_notification_states', (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('cascade')
        .notNullable()
      table
        .integer('notification_id')
        .unsigned()
        .references('id')
        .inTable('notifications')
        .onDelete('cascade')
        .notNullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('read_at').nullable()
      table.boolean('dismissed').notNullable().defaultTo(false)
      table.timestamp('dismissed_at').nullable()
      table.timestamps()

      table.unique(['user_id', 'notification_id'])
      table.index(['user_id', 'dismissed'], 'user_notification_states_lookup_idx')
    })
  }

  down() {
    this.schema.dropTable('user_notification_states')
  }
}

module.exports = UserNotificationStatesSchema
