'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class PendingMaterial extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('description', {})
    this.$addColumn('quantity', {})
    this.$addColumn('unit', {})
    this.$addColumn('notes', {})
    this.$addColumn('status', {})
    this.$addColumn('requested_by_technician', {})
    this.$addColumn('resolved_by_user', {})
    this.$addColumn('resolved_material_id', {})
    this.$addColumn('resolution_notes', {})
    this.$addColumn('destination', {})
    this.$addColumn('category_hint', {})
    this.$addColumn('usage_date', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
    this.$addRelation('technician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'requested_by_technician',
    })
  }
}

PendingMaterial.boot()

module.exports = PendingMaterial
