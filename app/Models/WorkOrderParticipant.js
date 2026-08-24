'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class WorkOrderParticipant extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('work_order_id', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('technician_name', {})
    this.$addColumn('first_joined_at', dateTimeColumn({ autoCreate: true }))
    this.$addColumn('last_active_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

WorkOrderParticipant.boot()

module.exports = WorkOrderParticipant
