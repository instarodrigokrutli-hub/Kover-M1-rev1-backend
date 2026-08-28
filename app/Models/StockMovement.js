'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class StockMovement extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('material_id', {})
    this.$addColumn('type', {})
    this.$addColumn('quantity', {})
    this.$addColumn('unit_value_snapshot', {})
    this.$addColumn('total_value', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('performed_by_user', {})
    this.$addColumn('reason', {})
    this.$addColumn('notes', {})
    this.$addColumn('nf_number', {})
    this.$addColumn('oc_number', {})
    this.$addColumn('justification', {})
    this.$addColumn('internal_wo_id', {})
    this.$addColumn('work_order_id', {})
    this.$addColumn('supplier_id', {})
    this.$addColumn('receipt_id', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))

    this.$addRelation('material', 'belongsTo', () => require('./Material'), {
      localKey: 'id',
      foreignKey: 'material_id',
    })
    this.$addRelation('technician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'technician_id',
    })
    this.$addRelation('supplier', 'belongsTo', () => require('./Supplier'), {
      localKey: 'id',
      foreignKey: 'supplier_id',
    })
    this.$addRelation('performedByUser', 'belongsTo', () => require('./User'), {
      localKey: 'id',
      foreignKey: 'performed_by_user',
    })
  }
}

StockMovement.boot()

module.exports = StockMovement
