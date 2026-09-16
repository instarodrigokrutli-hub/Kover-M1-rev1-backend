'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class UserNotificationState extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('user_id', {})
    this.$addColumn('notification_id', {})
    this.$addColumn('is_read', {})
    this.$addColumn('read_at', dateTimeColumn())
    this.$addColumn('dismissed', {})
    this.$addColumn('dismissed_at', dateTimeColumn())
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
  }
}

UserNotificationState.boot()

module.exports = UserNotificationState
