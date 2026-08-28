'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class MaintenancePlan extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('machine_id', {})
    this.$addColumn('name', {})
    this.$addColumn('description', {})
    this.$addColumn('service_type', {})
    this.$addColumn('periodicity', {})
    this.$addColumn('periodicity_value', {})
    this.$addColumn('estimated_minutes', {})
    this.$addColumn('due_days', {})
    this.$addColumn('active', {})
    this.$addColumn('last_generated_at', dateTimeColumn())
    this.$addColumn('created_by', {})
    this.$addColumn('updated_by', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
    this.$addRelation('machine', 'belongsTo', () => require('./Machine'), {
      localKey: 'id',
      foreignKey: 'machine_id',
    })
    this.$addRelation('items', 'hasMany', () => require('./MaintenancePlanItem'), {
      localKey: 'id',
      foreignKey: 'plan_id',
    })
  }
}

MaintenancePlan.boot()

module.exports = MaintenancePlan
