'use strict'

const Schema = use('Adonis/Lucid/Schema')

class SuppliersSchema extends Schema {
  up() {
    this.schema.createTable('suppliers', (table) => {
      table.increments('id')
      table.string('razao_social', 200).notNullable()
      table.string('nome_fantasia', 200).nullable()
      table.string('cnpj', 20).notNullable().unique()
      table.string('cidade', 100).nullable()
      table.string('estado', 2).nullable()
      table.string('telefone', 30).nullable()
      table.string('email', 200).nullable()
      table.string('contato', 120).nullable()
      table.enu('status', ['ativo', 'inativo']).notNullable().defaultTo('ativo')
      table.text('observacoes').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('set null').nullable()
      table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('set null').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('suppliers')
  }
}

module.exports = SuppliersSchema
