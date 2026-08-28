'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')

class Unit extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('code', { isPrimary: true })
    this.$addColumn('label', {})
    this.$addColumn('allows_decimal', {})
    this.$addColumn('active', {})
  }
}

Unit.boot()

module.exports = Unit
