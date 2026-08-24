'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class InternalWoMaterial extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('internal_wo_id', {})
    this.$addColumn('material_id', {})
    this.$addColumn('quantity', {})
    this.$addColumn('unit_value_snapshot', {})
    this.$addColumn('total_value', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))

    this.$addRelation('material', 'belongsTo', () => require('./Material'), {
      localKey: 'id',
      foreignKey: 'material_id',
    })
  }
}

InternalWoMaterial.boot()

module.exports = InternalWoMaterial
