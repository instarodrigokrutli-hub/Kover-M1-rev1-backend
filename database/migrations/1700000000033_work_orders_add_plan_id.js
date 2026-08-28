'use strict'

const Schema = use('Adonis/Lucid/Schema')

class WorkOrdersAddPlanId extends Schema {
  up() {
    this.schema.table('work_orders', (table) => {
      table
        .integer('plan_id')
        .unsigned()
        .references('id')
        .inTable('maintenance_plans')
        .onDelete('set null')
        .nullable()
    })
  }

  down() {
    this.schema.table('work_orders', (table) => {
      table.dropColumn('plan_id')
    })
  }
}

module.exports = WorkOrdersAddPlanId
