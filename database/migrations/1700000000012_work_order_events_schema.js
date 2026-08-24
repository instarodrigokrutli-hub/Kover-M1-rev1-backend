'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrderEventsSchema extends Schema {
  up() {
    this.schema.createTable('work_order_events', (table) => {
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
        .references('id')
        .inTable('technicians')
        .nullable()
      table.string('technician_name', 150).nullable()
      table.string('event_type', 60).notNullable()
      table.text('message').nullable()
      table.json('details').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('work_order_events')
  }
}

module.exports = WorkOrderEventsSchema
