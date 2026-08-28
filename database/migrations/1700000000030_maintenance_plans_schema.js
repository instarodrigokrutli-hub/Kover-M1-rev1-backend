'use strict'

const Schema = use('Adonis/Lucid/Schema')

class MaintenancePlansSchema extends Schema {
  up() {
    this.schema.createTable('maintenance_plans', (table) => {
      table.increments('id')
      table
        .integer('machine_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('machines')
        .onDelete('cascade')
      table.string('name', 120).notNullable()
      table.text('description').notNullable().defaultTo('')
      table
        .enu('service_type', [
          'mecanico', 'eletrico', 'hidraulico', 'pneumatico',
          'instrumentacao', 'lubrificacao', 'solda', 'outro',
        ])
        .notNullable()
        .defaultTo('mecanico')
      table
        .enu('periodicity', [
          'diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral',
          'trimestral', 'semestral', 'anual', 'horimetro', 'quilometragem', 'ciclos',
        ])
        .notNullable()
        .defaultTo('mensal')
      table.decimal('periodicity_value', 18, 4).nullable()
      table.integer('estimated_minutes').notNullable().defaultTo(60)
      table.integer('due_days').notNullable().defaultTo(7)
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('last_generated_at').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('set null').nullable()
      table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('set null').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('maintenance_plans')
  }
}

module.exports = MaintenancePlansSchema
