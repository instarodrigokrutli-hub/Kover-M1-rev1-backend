'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class Machine extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('name', {})
    this.$addColumn('sector', {})
    this.$addColumn('status', {})
    this.$addColumn('code', {})
    this.$addColumn('fabricante', {})
    this.$addColumn('modelo', {})
    this.$addColumn('serial_number', {})
    this.$addColumn('acquired_at', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

Machine.boot()

module.exports = Machine
