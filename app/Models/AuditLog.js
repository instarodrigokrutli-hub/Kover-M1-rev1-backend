'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class AuditLog extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('action', {})
    this.$addColumn('actor_user_id', {})
    this.$addColumn('actor_technician_id', {})
    this.$addColumn('actor_role', {})
    this.$addColumn('entity_type', {})
    this.$addColumn('entity_id', {})
    this.$addColumn('ip', {})
    this.$addColumn('user_agent', {})
    this.$addColumn('details', {
      consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
      prepare: (value) => (value ? JSON.stringify(value) : value),
    })
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

AuditLog.boot()

module.exports = AuditLog
