'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class Supplier extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('razao_social', {})
    this.$addColumn('nome_fantasia', {})
    this.$addColumn('cnpj', {})
    this.$addColumn('cidade', {})
    this.$addColumn('estado', {})
    this.$addColumn('telefone', {})
    this.$addColumn('email', {})
    this.$addColumn('contato', {})
    this.$addColumn('status', {})
    this.$addColumn('observacoes', {})
    this.$addColumn('created_by', {})
    this.$addColumn('updated_by', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))
  }
}

Supplier.boot()

module.exports = Supplier
