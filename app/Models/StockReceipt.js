'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class StockReceipt extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('supplier_id', {})
    this.$addColumn('nf_number', {})
    this.$addColumn('oc_number', {})
    this.$addColumn('received_at', dateTimeColumn())
    this.$addColumn('received_by', {})
    this.$addColumn('notes', {})
    this.$addColumn('items_count', {})
    this.$addColumn('total_value', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
    this.$addRelation('supplier', 'belongsTo', () => require('./Supplier'), {
      localKey: 'id',
      foreignKey: 'supplier_id',
    })
  }
}

StockReceipt.boot()

module.exports = StockReceipt
