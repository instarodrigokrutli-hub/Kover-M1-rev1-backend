'use strict'

const Schema = use('Adonis/Lucid/Schema')

class PurchaseRequestsSchema extends Schema {
  up() {
    this.schema.createTable('purchase_requests', (table) => {
      table.increments('id')
      table.string('material_name', 120).notNullable()
      table.text('description').nullable()
      table.decimal('quantity', 18, 4).notNullable()
      table.string('unit', 10).notNullable()
      table.string('destination', 200).notNullable()
      table.string('machine', 120).nullable()
      table.enu('priority', ['baixa', 'media', 'alta', 'urgente']).notNullable().defaultTo('media')
      table.enu('status', ['pendente', 'aprovada', 'reprovada']).notNullable().defaultTo('pendente')
      table
        .integer('requested_by_user')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table
        .integer('requested_by_technician')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()
      table
        .integer('analyzed_by_user')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table.timestamp('analyzed_at').nullable()
      table.text('rejection_reason').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('purchase_requests')
  }
}

module.exports = PurchaseRequestsSchema
