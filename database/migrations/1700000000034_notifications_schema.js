'use strict'

const Schema = use('Adonis/Lucid/Schema')

class NotificationsSchema extends Schema {
  up() {
    this.schema.createTable('notifications', (table) => {
      table.increments('id')
      table.string('type', 60).notNullable()
      table.string('category', 30).notNullable().defaultTo('os')
      table.string('title', 200).notNullable()
      table.text('description').notNullable().defaultTo('')
      table.timestamp('event_at').notNullable()
      table
        .integer('actor_user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table
        .integer('actor_technician_id')
        .unsigned()
        .references('id')
        .inTable('technicians')
        .onDelete('set null')
        .nullable()
      table.string('actor_name', 120).nullable()
      table
        .integer('machine_id')
        .unsigned()
        .references('id')
        .inTable('machines')
        .onDelete('set null')
        .nullable()
      table.string('machine_name', 150).nullable()
      table
        .integer('work_order_id')
        .unsigned()
        .references('id')
        .inTable('work_orders')
        .onDelete('cascade')
        .nullable()
      table.string('work_order_number', 40).nullable()
      table.enu('priority', ['critica', 'importante', 'informativa']).notNullable().defaultTo('informativa')
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('read_at').nullable()
      table
        .integer('read_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table.string('push_status', 20).notNullable().defaultTo('pendente')
      table.timestamp('push_sent_at').nullable()
      table.json('payload').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['event_at'], 'notifications_event_at_idx')
      table.index(['is_read', 'event_at'], 'notifications_unread_idx')
    })
  }

  down() {
    this.schema.dropTable('notifications')
  }
}

module.exports = NotificationsSchema
