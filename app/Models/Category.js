'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class Category extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('name', {})
    this.$addColumn('active', {})
    this.$addColumn('created_by', {})
    this.$addColumn('updated_by', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

Category.boot()

module.exports = Category
