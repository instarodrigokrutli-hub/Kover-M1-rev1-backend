'use strict'

const Schema = use('Adonis/Lucid/Schema')

class TechnicianSessionsSchema extends Schema {
  up() {
    this.schema.createTable('technician_sessions', (table) => {
      table.increments('id')

      table
        .integer('technician_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('technicians')
        .onDelete('cascade')

      table.string('token_hash', 128).notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('last_activity_at').notNullable()
      table.string('ip', 64).nullable()
      table.string('user_agent', 255).nullable()
      table.timestamp('revoked_at').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['technician_id'])
    })
  }

  down() {
    this.schema.dropTable('technician_sessions')
  }
}

module.exports = TechnicianSessionsSchema
