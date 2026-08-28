'use strict'

const Schema = use('Adonis/Lucid/Schema')

class StockMovementsAddSupplierReceipt extends Schema {
  up() {
    this.schema.table('stock_movements', (table) => {
      table
        .integer('supplier_id')
        .unsigned()
        .references('id')
        .inTable('suppliers')
        .onDelete('set null')
        .nullable()
      table
        .integer('receipt_id')
        .unsigned()
        .references('id')
        .inTable('stock_receipts')
        .onDelete('set null')
        .nullable()
    })
  }

  down() {
    this.schema.table('stock_movements', (table) => {
      table.dropColumn('supplier_id')
      table.dropColumn('receipt_id')
    })
  }
}

module.exports = StockMovementsAddSupplierReceipt
