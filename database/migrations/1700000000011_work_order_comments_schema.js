'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrderCommentsSchema extends Schema {
  up() {
    this.schema.createTable('work_order_comments', (table) => {
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
      table.string('technician_name', 150).notNullable()
      table.text('comment').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('work_order_comments')
  }
}

module.exports = WorkOrderCommentsSchema
