'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrderChecklistItemsSchema extends Schema {
  up() {
    this.schema.createTable('work_order_checklist_items', (table) => {
      table.increments('id')
      table
        .integer('work_order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('work_orders')
        .onDelete('cascade')
      table
        .integer('plan_item_id')
        .unsigned()
        .references('id')
        .inTable('maintenance_plan_items')
        .onDelete('set null')
        .nullable()
      table.text('description').notNullable()
      table.integer('position').notNullable().defaultTo(0)
      table.text('notes').nullable()
      table.boolean('required').notNullable().defaultTo(true)
      table
        .enu('status', ['nao_iniciado', 'em_andamento', 'concluido', 'nao_se_aplica'])
        .notNullable()
        .defaultTo('nao_iniciado')
      table
        .integer('technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()
      table.string('technician_name', 120).nullable()
      table.timestamp('updated_at').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('work_order_checklist_items')
  }
}

module.exports = WorkOrderChecklistItemsSchema
