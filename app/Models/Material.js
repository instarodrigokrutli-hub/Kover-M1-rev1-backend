'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class Material extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('code', {})
    this.$addColumn('name', {})
    this.$addColumn('category_id', {})
    this.$addColumn('unit', {})
    this.$addColumn('quantity', {})
    this.$addColumn('unit_value', {})
    this.$addColumn('min_quantity', {})
    this.$addColumn('notes', {})
    this.$addColumn('status', {})
    this.$addColumn('created_by', {})
    this.$addColumn('updated_by', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))

    this.$addRelation('category', 'belongsTo', () => require('./Category'), {
      localKey: 'id',
      foreignKey: 'category_id',
    })
  }
}

Material.boot()

module.exports = Material
