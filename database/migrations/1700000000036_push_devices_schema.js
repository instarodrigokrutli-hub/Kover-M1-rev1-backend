'use strict'

const Schema = use('Adonis/Lucid/Schema')

class PushDevicesSchema extends Schema {
  up() {
    this.schema.createTable('push_devices', (table) => {
      table.increments('id')
      table.text('token').notNullable().unique()
      table.string('device_name', 120).nullable()
      table.string('platform', 20).notNullable().defaultTo('web')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('cascade')
        .nullable()
      table
        .integer('technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('cascade')
        .nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('last_seen_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('push_devices')
  }
}

module.exports = PushDevicesSchema
