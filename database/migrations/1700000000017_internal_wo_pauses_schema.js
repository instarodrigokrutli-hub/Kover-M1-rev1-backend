'use strict'

const Schema = use('Adonis/Lucid/Schema')

class InternalWoPausesSchema extends Schema {
  up() {
    this.schema.createTable('internal_wo_pauses', (table) => {
      table.increments('id')
      table
        .integer('internal_wo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('internal_work_orders')
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
    this.schema.dropTable('internal_wo_pauses')
  }
}

module.exports = InternalWoPausesSchema
