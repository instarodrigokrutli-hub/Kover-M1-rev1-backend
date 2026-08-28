'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class Notification extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('type', {})
    this.$addColumn('category', {})
    this.$addColumn('title', {})
    this.$addColumn('description', {})
    this.$addColumn('event_at', dateTimeColumn())
    this.$addColumn('actor_user_id', {})
    this.$addColumn('actor_technician_id', {})
    this.$addColumn('actor_name', {})
    this.$addColumn('machine_id', {})
    this.$addColumn('machine_name', {})
    this.$addColumn('work_order_id', {})
    this.$addColumn('work_order_number', {})
    this.$addColumn('priority', {})
    this.$addColumn('is_read', {})
    this.$addColumn('read_at', dateTimeColumn())
    this.$addColumn('read_by', {})
    this.$addColumn('push_status', {})
    this.$addColumn('push_sent_at', dateTimeColumn())
    this.$addColumn('payload', {
      consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
      prepare: (value) => JSON.stringify(value ?? {}),
    })
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
  }
}

Notification.boot()

module.exports = Notification
