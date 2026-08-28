'use strict'

const Schema = use('Adonis/Lucid/Schema')

class UnitsSchema extends Schema {
  up() {
    this.schema.createTable('units', (table) => {
      table.string('code', 10).primary()
      table.string('label', 20).notNullable()
      table.boolean('allows_decimal').notNullable().defaultTo(false)
      table.boolean('active').notNullable().defaultTo(true)
    })
  }

  down() {
    this.schema.dropTable('units')
  }
}

module.exports = UnitsSchema
