'use strict'

const Schema = use('Adonis/Lucid/Schema')

const IWO_SERVICE_TYPE = [
  'mecanico', 'eletrico', 'pneumatico', 'hidraulico', 'eletronico',
  'instrumentacao', 'lubrificacao', 'soldagem', 'outro',
]
const IWO_STATUS = ['aberta', 'concluida', 'aceita', 'em_atendimento', 'pausada']

class InternalWorkOrdersSchema extends Schema {
  up() {
    this.schema.createTable('internal_work_orders', (table) => {
      table.increments('id')
      table.string('code', 30).nullable().unique()
      table.string('origin', 40).notNullable().defaultTo('manutencao')

      table
        .integer('machine_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('machines')
        .onDelete('restrict')
      table.string('sector', 100).notNullable()

      // Nullable (não NOT NULL): resolve a contradição do schema original,
      // que tinha NOT NULL + ON DELETE SET NULL ao mesmo tempo — mantemos
      // o comportamento real (nullable) em vez da declaração inconsistente.
      table
        .integer('technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()

      table.timestamp('opened_at').notNullable()
      table.enu('service_type', IWO_SERVICE_TYPE).notNullable()
      table.text('description').notNullable()
      table.text('technician_comment').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.enu('status', IWO_STATUS).notNullable().defaultTo('concluida')

      table.timestamp('accepted_at').nullable()
      table.timestamp('paused_at').nullable()
      table.integer('total_paused_seconds').notNullable().defaultTo(0)

      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('internal_work_orders')
  }
}

module.exports = InternalWorkOrdersSchema
