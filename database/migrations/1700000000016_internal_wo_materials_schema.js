'use strict'

const Schema = use('Adonis/Lucid/Schema')

class InternalWoMaterialsSchema extends Schema {
  up() {
    this.schema.createTable('internal_wo_materials', (table) => {
      table.increments('id')
      table
        .integer('internal_wo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('internal_work_orders')
        .onDelete('cascade')
      table
        .integer('material_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('materials')
        .onDelete('restrict')
      table.decimal('quantity', 18, 4).notNullable()
      table.decimal('unit_value_snapshot', 18, 4).notNullable().defaultTo(0)
      table.decimal('total_value', 18, 4).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('internal_wo_materials')
  }
}

module.exports = InternalWoMaterialsSchema
