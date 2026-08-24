'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class InternalWoPause extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('internal_wo_id', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('reason', {})
    this.$addColumn('started_at', dateTimeColumn({ autoCreate: true }))
    this.$addColumn('ended_at', dateTimeColumn())
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

InternalWoPause.boot()

module.exports = InternalWoPause
