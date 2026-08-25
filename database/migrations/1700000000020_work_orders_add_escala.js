'use strict'

const Schema = use('Adonis/Lucid/Schema')

const WO_ESCALA = ['3x3', '6x1', '5x2']

class WorkOrdersAddEscala extends Schema {
  up() {
    this.schema.table('work_orders', (table) => {
      table.enu('requester_escala', WO_ESCALA).nullable()
    })
  }

  down() {
    this.schema.table('work_orders', (table) => {
      table.dropColumn('requester_escala')
    })
  }
}

module.exports = WorkOrdersAddEscala
