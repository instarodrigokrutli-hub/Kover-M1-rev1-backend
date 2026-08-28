'use strict'

const Schema = use('Adonis/Lucid/Schema')

class MaintenancePlanItemsSchema extends Schema {
  up() {
    this.schema.createTable('maintenance_plan_items', (table) => {
      table.increments('id')
      table
        .integer('plan_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('maintenance_plans')
        .onDelete('cascade')
      table.text('description').notNullable()
      table.integer('position').notNullable().defaultTo(0)
      table.text('notes').nullable()
      table.boolean('required').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('maintenance_plan_items')
  }
}

module.exports = MaintenancePlanItemsSchema
