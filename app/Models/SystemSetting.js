'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class SystemSetting extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('key', { isPrimary: true })
    this.$addColumn('value', {
      consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
      prepare: (value) => JSON.stringify(value ?? {}),
    })
    this.$addColumn('updated_by', {})
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

SystemSetting.boot()

module.exports = SystemSetting
