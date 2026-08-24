'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrderMaterialsSchema extends Schema {
  up() {
    this.schema.createTable('work_order_materials', (table) => {
      table.increments('id')
      table
        .integer('work_order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('work_orders')
        .onDelete('cascade')
      table
        .integer('material_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('materials')
      table.decimal('quantity', 18, 4).notNullable()
      table.decimal('unit_value_snapshot', 18, 4).notNullable().defaultTo(0)
      table.decimal('total_value', 18, 4).notNullable().defaultTo(0)
      table
        .integer('technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('work_order_materials')
  }
}

module.exports = WorkOrderMaterialsSchema
