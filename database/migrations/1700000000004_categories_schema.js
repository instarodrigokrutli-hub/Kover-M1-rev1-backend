'use strict'

const Schema = use('Adonis/Lucid/Schema')

class CategoriesSchema extends Schema {
  up() {
    this.schema.createTable('categories', (table) => {
      table.increments('id')
      table.string('name', 120).notNullable().unique()
      table.boolean('active').notNullable().defaultTo(true)

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
    this.schema.dropTable('categories')
  }
}

module.exports = CategoriesSchema
