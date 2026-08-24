'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class TechnicianSession extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('technician_id', {})
    this.$addColumn('token_hash', { serializeAs: null })
    this.$addColumn('expires_at', dateTimeColumn())
    this.$addColumn('last_activity_at', dateTimeColumn())
    this.$addColumn('ip', {})
    this.$addColumn('user_agent', {})
    this.$addColumn('revoked_at', dateTimeColumn())
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))

    this.$addRelation('technician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'technician_id',
    })
  }
}

TechnicianSession.boot()

module.exports = TechnicianSession
