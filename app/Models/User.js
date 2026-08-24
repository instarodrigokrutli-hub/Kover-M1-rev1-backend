'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class User extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('email', {})
    this.$addColumn('username', {})
    this.$addColumn('password_hash', { serializeAs: null })
    this.$addColumn('full_name', {})
    this.$addColumn('cargo', {})
    this.$addColumn('status', {})
    this.$addColumn('matricula', {})
    this.$addColumn('sector_id', {})
    this.$addColumn('turno', {})
    this.$addColumn('email_confirmed', {})
    this.$addColumn('banned', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))

    this.$addRelation('sector', 'belongsTo', () => require('./Sector'), {
      localKey: 'id',
      foreignKey: 'sector_id',
    })
    this.$addRelation('roles', 'hasMany', () => require('./UserRole'), {
      localKey: 'id',
      foreignKey: 'user_id',
    })
  }
}

User.boot()

module.exports = User
