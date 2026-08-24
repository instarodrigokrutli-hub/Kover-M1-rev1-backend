'use strict'

const Schema = use('Adonis/Lucid/Schema')

class SectorsSchema extends Schema {
  up() {
    this.schema.createTable('sectors', (table) => {
      table.increments('id')
      table.string('name', 120).notNullable().unique()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('sectors')
  }
}

module.exports = SectorsSchema
