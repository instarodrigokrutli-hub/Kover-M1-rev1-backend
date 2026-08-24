'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class Technician extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('name', {})
    this.$addColumn('code_hash', { serializeAs: null })
    this.$addColumn('status', {})
    this.$addColumn('created_by', {})
    this.$addColumn('updated_by', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))

    this.$addRelation('sessions', 'hasMany', () => require('./TechnicianSession'), {
      localKey: 'id',
      foreignKey: 'technician_id',
    })
  }
}

Technician.boot()

module.exports = Technician
