'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class UserRole extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('user_id', {})
    this.$addColumn('role', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true }))

    this.$addRelation('user', 'belongsTo', () => require('./User'), {
      localKey: 'id',
      foreignKey: 'user_id',
    })
  }
}

UserRole.boot()

module.exports = UserRole
