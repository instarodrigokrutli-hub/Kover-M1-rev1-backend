'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class TechActivity extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('technician_id', {})
    this.$addColumn('activity_date', {})
    this.$addColumn('start_time', {})
    this.$addColumn('end_time', {})
    this.$addColumn('machine_id', {})
    this.$addColumn('sector', {})
    this.$addColumn('activity_type', {})
    this.$addColumn('description', {})
    this.$addColumn('notes', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
    this.$addRelation('machine', 'belongsTo', () => require('./Machine'), {
      localKey: 'id',
      foreignKey: 'machine_id',
    })
    this.$addRelation('technician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'technician_id',
    })
  }
}

TechActivity.boot()

module.exports = TechActivity
