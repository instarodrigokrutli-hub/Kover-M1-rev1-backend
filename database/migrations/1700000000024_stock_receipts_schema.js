'use strict'

const Schema = use('Adonis/Lucid/Schema')

class StockReceiptsSchema extends Schema {
  up() {
    this.schema.createTable('stock_receipts', (table) => {
      table.increments('id')
      table
        .integer('supplier_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('suppliers')
        .onDelete('restrict')
      table.string('nf_number', 60).notNullable()
      table.string('oc_number', 60).nullable()
      table.timestamp('received_at').notNullable()
      table
        .integer('received_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table.text('notes').nullable()
      table.integer('items_count').notNullable().defaultTo(0)
      table.decimal('total_value', 18, 4).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('stock_receipts')
  }
}

module.exports = StockReceiptsSchema
