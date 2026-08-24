'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class WorkOrderEvent extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('work_order_id', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('technician_name', {})
    this.$addColumn('event_type', {})
    this.$addColumn('message', {})
    this.$addColumn('details', {
      consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
      prepare: (value) => (value ? JSON.stringify(value) : value),
    })
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

WorkOrderEvent.boot()

module.exports = WorkOrderEvent
