'use strict'

const Schema = use('Adonis/Lucid/Schema')

const MOVEMENT_TYPES = [
  'retirada', 'ajuste_entrada', 'ajuste_saida', 'inventario_inicial', 'recebimento',
]

class StockMovementsSchema extends Schema {
  up() {
    this.schema.createTable('stock_movements', (table) => {
      table.increments('id')
      table
        .integer('material_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('materials')
        .onDelete('restrict')

      table.enu('type', MOVEMENT_TYPES).notNullable()
      table.decimal('quantity', 18, 4).notNullable()
      table.decimal('unit_value_snapshot', 18, 4).notNullable().defaultTo(0)
      table.decimal('total_value', 18, 4).notNullable().defaultTo(0)

      table
        .integer('technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()
      table
        .integer('performed_by_user')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()

      table.text('reason').nullable()
      table.text('notes').nullable()
      table.string('nf_number', 60).nullable()
      table.string('oc_number', 60).nullable()
      table.text('justification').nullable()

      table
        .integer('internal_wo_id')
        .unsigned()
        .references('id')
        .inTable('internal_work_orders')
        .onDelete('set null')
        .nullable()
      table
        .integer('work_order_id')
        .unsigned()
        .references('id')
        .inTable('work_orders')
        .nullable()

      table.timestamp('created_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('stock_movements')
  }
}

module.exports = StockMovementsSchema
