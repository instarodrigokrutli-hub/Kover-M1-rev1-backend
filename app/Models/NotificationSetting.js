'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class NotificationSetting extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('perfil', {})
    this.$addColumn('evento', {})
    this.$addColumn('receber_sistema', {})
    this.$addColumn('receber_push', {})
    this.$addColumn('prioridade', {})
    this.$addColumn('ativo', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

NotificationSetting.boot()

module.exports = NotificationSetting
