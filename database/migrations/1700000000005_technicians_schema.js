'use strict'

const Schema = use('Adonis/Lucid/Schema')

class TechniciansSchema extends Schema {
  up() {
    this.schema.createTable('technicians', (table) => {
      table.increments('id')
      table.string('name', 120).notNullable()
      table.string('code_hash', 255).notNullable()
      table.enu('status', ['ativo', 'inativo']).notNullable().defaultTo('ativo')

      table
        .integer('created_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table
        .integer('updated_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()

      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('technicians')
  }
}

module.exports = TechniciansSchema
