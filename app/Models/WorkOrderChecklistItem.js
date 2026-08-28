'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class WorkOrderChecklistItem extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('work_order_id', {})
    this.$addColumn('plan_item_id', {})
    this.$addColumn('description', {})
    this.$addColumn('position', {})
    this.$addColumn('notes', {})
    this.$addColumn('required', {})
    this.$addColumn('status', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('technician_name', {})
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

WorkOrderChecklistItem.boot()

module.exports = WorkOrderChecklistItem
