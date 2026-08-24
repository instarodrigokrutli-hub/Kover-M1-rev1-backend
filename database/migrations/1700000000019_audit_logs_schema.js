'use strict'

const Schema = use('Adonis/Lucid/Schema')

class AuditLogsSchema extends Schema {
  up() {
    this.schema.createTable('audit_logs', (table) => {
      table.increments('id')
      table.string('action', 80).notNullable()
      table
        .integer('actor_user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table
        .integer('actor_technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()
      table.string('actor_role', 40).nullable()
      table.string('entity_type', 60).nullable()
      table.string('entity_id', 60).nullable()
      table.string('ip', 64).nullable()
      table.string('user_agent', 255).nullable()
      table.json('details').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('audit_logs')
  }
}

module.exports = AuditLogsSchema
