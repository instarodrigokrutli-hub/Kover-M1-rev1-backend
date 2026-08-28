'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class MaintenancePlanItem extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('plan_id', {})
    this.$addColumn('description', {})
    this.$addColumn('position', {})
    this.$addColumn('notes', {})
    this.$addColumn('required', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

MaintenancePlanItem.boot()

module.exports = MaintenancePlanItem
