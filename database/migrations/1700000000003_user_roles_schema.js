'use strict'

const Schema = use('Adonis/Lucid/Schema')

class UserRolesSchema extends Schema {
  up() {
    this.schema.createTable('user_roles', (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('cascade')

      table.enu('role', ['admin', 'coordenador', 'producao']).notNullable()
      table.timestamp('created_at').notNullable()

      table.unique(['user_id', 'role'])
    })
  }

  down() {
    this.schema.dropTable('user_roles')
  }
}

module.exports = UserRolesSchema
