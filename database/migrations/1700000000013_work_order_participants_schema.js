'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrderParticipantsSchema extends Schema {
  up() {
    this.schema.createTable('work_order_participants', (table) => {
      table.increments('id')
      table
        .integer('work_order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('work_orders')
        .onDelete('cascade')
      table
        .integer('technician_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('technicians')
      table.string('technician_name', 150).notNullable()
      table.timestamp('first_joined_at').notNullable()
      table.timestamp('last_active_at').notNullable()
      table.timestamp('created_at').notNullable()

      table.unique(['work_order_id', 'technician_id'])
    })
  }

  down() {
    this.schema.dropTable('work_order_participants')
  }
}

module.exports = WorkOrderParticipantsSchema
