'use strict'

const Schema = use('Adonis/Lucid/Schema')

class SystemSettingsSchema extends Schema {
  up() {
    this.schema.createTable('system_settings', (table) => {
      table.string('key', 80).primary()
      table.text('value').notNullable().defaultTo('{}')
      table
        .integer('updated_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('set null')
        .nullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  down() {
    this.schema.dropTable('system_settings')
  }
}

module.exports = SystemSettingsSchema
