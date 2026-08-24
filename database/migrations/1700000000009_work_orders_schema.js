'use strict'

const Schema = use('Adonis/Lucid/Schema')

const WO_STATUS = [
  'aguardando_atendimento', 'aceita', 'em_atendimento', 'pausada',
  'aguardando_avaliacao', 'encerrada', 'reaberta', 'cancelada', 'concluida',
]
const WO_PRIORITY = ['baixa', 'media', 'alta', 'emergencial']
const WO_SERVICE_TYPE = [
  'mecanico', 'eletrico', 'hidraulico', 'pneumatico',
  'instrumentacao', 'lubrificacao', 'solda', 'outro',
]
const WO_OCCURRENCE_TYPE = [
  'mecanica', 'eletrica', 'hidraulica', 'pneumatica',
  'instrumentacao', 'processo', 'seguranca', 'outro',
]
const WO_MAINTENANCE_TYPE = ['corretiva', 'preventiva', 'preditiva', 'inspecao']

class WorkOrdersSchema extends Schema {
  up() {
    this.schema.createTable('work_orders', (table) => {
      table.increments('id')
      table.string('number', 30).nullable().unique()

      table
        .integer('requester_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('restrict')
      table.string('requester_name', 150).notNullable()
      table
        .integer('requester_sector_id')
        .unsigned()
        .references('id')
        .inTable('sectors')
        .nullable()
      table.string('requester_sector_name', 120).nullable()
      table.string('requester_turno', 20).nullable()

      table
        .integer('machine_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('machines')
        .onDelete('restrict')
      table.string('machine_code', 40).nullable()
      table.string('machine_name', 150).notNullable()
      table.string('machine_sector', 100).notNullable()

      table.enu('priority', WO_PRIORITY).notNullable()
      table.text('description').notNullable()
      table.enu('status', WO_STATUS).notNullable().defaultTo('aguardando_atendimento')
      table.timestamp('opened_at').notNullable()

      table
        .integer('technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .nullable()
      table.timestamp('accepted_at').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.enu('service_type', WO_SERVICE_TYPE).nullable()
      table.text('technician_comment').nullable()
      table.text('final_comment').nullable()

      table.timestamp('evaluated_at').nullable()
      table.boolean('evaluation_result').nullable()
      table.text('evaluation_comment').nullable()
      table.text('reopen_reason').nullable()
      table.timestamp('reopened_at').nullable()
      table.integer('reopen_count').notNullable().defaultTo(0)

      table.enu('occurrence_type', WO_OCCURRENCE_TYPE).nullable()
      table.boolean('machine_stopped').nullable()
      table.timestamp('paused_at').nullable()
      table.integer('total_paused_seconds').notNullable().defaultTo(0)

      table.enu('maintenance_type', WO_MAINTENANCE_TYPE).notNullable().defaultTo('corretiva')
      table.timestamp('due_at').nullable()
      table.integer('estimated_minutes').nullable()
      table.timestamp('validated_at').nullable()
      table
        .integer('validated_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .nullable()
      table.text('validation_comment').nullable()

      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('work_orders')
  }
}

module.exports = WorkOrdersSchema
