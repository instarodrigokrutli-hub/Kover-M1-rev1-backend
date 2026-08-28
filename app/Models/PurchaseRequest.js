'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class PurchaseRequest extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('material_name', {})
    this.$addColumn('description', {})
    this.$addColumn('quantity', {})
    this.$addColumn('unit', {})
    this.$addColumn('destination', {})
    this.$addColumn('machine', {})
    this.$addColumn('priority', {})
    this.$addColumn('status', {})
    this.$addColumn('requested_by_user', {})
    this.$addColumn('requested_by_technician', {})
    this.$addColumn('analyzed_by_user', {})
    this.$addColumn('analyzed_at', dateTimeColumn())
    this.$addColumn('rejection_reason', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
    this.$addRelation('requesterUser', 'belongsTo', () => require('./User'), {
      localKey: 'id',
      foreignKey: 'requested_by_user',
    })
    this.$addRelation('requesterTechnician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'requested_by_technician',
    })
    this.$addRelation('analyzer', 'belongsTo', () => require('./User'), {
      localKey: 'id',
      foreignKey: 'analyzed_by_user',
    })
  }
}

PurchaseRequest.boot()

module.exports = PurchaseRequest
