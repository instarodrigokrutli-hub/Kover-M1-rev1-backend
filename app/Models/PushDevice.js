'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class PushDevice extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('token', {})
    this.$addColumn('device_name', {})
    this.$addColumn('platform', {})
    this.$addColumn('user_id', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('active', {})
    this.$addColumn('last_seen_at', dateTimeColumn())
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

PushDevice.boot()

module.exports = PushDevice
