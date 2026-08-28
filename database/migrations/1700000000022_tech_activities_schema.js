'use strict'

const Schema = use('Adonis/Lucid/Schema')

class TechActivitiesSchema extends Schema {
  up() {
    this.schema.createTable('tech_activities', (table) => {
      table.increments('id')
      table
        .integer('technician_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('technicians')
        .onDelete('cascade')
      table.date('activity_date').notNullable()
      table.string('start_time', 5).notNullable()
      table.string('end_time', 5).notNullable()
      table
        .integer('machine_id')
        .unsigned()
        .references('id')
        .inTable('machines')
        .onDelete('set null')
        .nullable()
      table.string('sector', 80).notNullable()
      table
        .enu('activity_type', [
          'limpeza', 'organizacao', 'lubrificacao', 'inspecao', 'fabricacao',
          'ajuste', 'apoio_producao', 'soldagem', 'outro',
        ])
        .notNullable()
      table.text('description').notNullable()
      table.text('notes').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('tech_activities')
  }
}

module.exports = TechActivitiesSchema
