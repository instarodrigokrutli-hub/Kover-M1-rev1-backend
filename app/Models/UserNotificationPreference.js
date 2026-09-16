'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class UserNotificationPreference extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('user_id', {})
    this.$addColumn('evento', {})
    this.$addColumn('ativo', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
  }
}

UserNotificationPreference.boot()

module.exports = UserNotificationPreference
