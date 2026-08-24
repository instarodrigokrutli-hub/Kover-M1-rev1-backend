'use strict'

const Schema = use('Adonis/Lucid/Schema')

class MachinesSchema extends Schema {
  up() {
    this.schema.createTable('machines', (table) => {
      table.increments('id')
      table.string('name', 150).notNullable()
      table.string('sector', 100).notNullable()
      table.string('status', 20).notNullable().defaultTo('ativo')
      table.string('code', 40).nullable().unique()
      table.string('fabricante', 120).nullable()
      table.string('modelo', 120).nullable()
      table.string('serial_number', 120).nullable()
      table.date('acquired_at').nullable()
      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('machines')
  }
}

module.exports = MachinesSchema
