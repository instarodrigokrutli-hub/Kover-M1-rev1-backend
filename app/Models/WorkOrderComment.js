'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class WorkOrderComment extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('work_order_id', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('technician_name', {})
    this.$addColumn('comment', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

WorkOrderComment.boot()

module.exports = WorkOrderComment
