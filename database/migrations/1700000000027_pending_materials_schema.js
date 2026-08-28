'use strict'

const Schema = use('Adonis/Lucid/Schema')

class PendingMaterialsSchema extends Schema {
  up() {
    this.schema.createTable('pending_materials', (table) => {
      table.increments('id')
      table.text('description').notNullable()
      table.decimal('quantity', 18, 4).notNullable()
      table.string('unit', 10).notNullable()
      table.text('notes').nullable()
      table
        .enu('status', ['pendente', 'aprovado', 'rejeitado', 'vinculado', 'concluido'])
        .notNullable()
        .defaultTo('pendente')
      table
        .integer('requested_by_technician')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()
      table
        .integer('resolved_by_user')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table
        .integer('resolved_material_id')
        .unsigned()
        .references('id')
        .inTable('materials')
        .onDelete('set null')
        .nullable()
      table.text('resolution_notes').nullable()
      table.string('destination', 200).nullable()
      table.string('category_hint', 120).nullable()
      table.date('usage_date').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('pending_materials')
  }
}

module.exports = PendingMaterialsSchema
