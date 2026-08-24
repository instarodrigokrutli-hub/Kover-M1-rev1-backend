'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class WorkOrderMaterial extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('work_order_id', {})
    this.$addColumn('material_id', {})
    this.$addColumn('quantity', {})
    this.$addColumn('unit_value_snapshot', {})
    this.$addColumn('total_value', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))

    this.$addRelation('material', 'belongsTo', () => require('./Material'), {
      localKey: 'id',
      foreignKey: 'material_id',
    })
    this.$addRelation('technician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'technician_id',
    })
  }
}

WorkOrderMaterial.boot()

module.exports = WorkOrderMaterial
