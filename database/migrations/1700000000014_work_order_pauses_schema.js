'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrderPausesSchema extends Schema {
  up() {
    this.schema.createTable('work_order_pauses', (table) => {
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
        .onDelete('set null')
        .nullable()
      table.text('reason').notNullable()
      table.timestamp('started_at').notNullable()
      table.timestamp('ended_at').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('work_order_pauses')
  }
}

module.exports = WorkOrderPausesSchema
