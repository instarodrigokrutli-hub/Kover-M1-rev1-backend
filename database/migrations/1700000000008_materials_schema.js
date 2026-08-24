'use strict'

const Schema = use('Adonis/Lucid/Schema')

const UNIT_CODES = [
  'UN', 'PC', 'CJ', 'PAR', 'MM', 'CM', 'M', 'M2', 'M3', 'POL',
  'KG', 'G', 'L', 'ML', 'CX', 'RL', 'SC', 'BD', 'LT', 'PCT',
]

class MaterialsSchema extends Schema {
  up() {
    this.schema.createTable('materials', (table) => {
      table.increments('id')
      table.string('code', 40).notNullable().unique()
      table.string('name', 150).notNullable()

      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('restrict')

      table.enu('unit', UNIT_CODES).notNullable()
      table.decimal('quantity', 18, 4).notNullable().defaultTo(0)
      table.decimal('unit_value', 18, 4).notNullable().defaultTo(0)
      table.decimal('min_quantity', 18, 4).notNullable().defaultTo(0)
      table.text('notes').nullable()
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
    this.schema.dropTable('materials')
  }
}

module.exports = MaterialsSchema
