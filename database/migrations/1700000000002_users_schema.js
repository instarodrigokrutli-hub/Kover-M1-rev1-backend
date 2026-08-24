'use strict'

const Schema = use('Adonis/Lucid/Schema')

/*
|--------------------------------------------------------------------------
| database/migrations/..._users_schema.js
|--------------------------------------------------------------------------
|
| Substitui, num só lugar, o que no sistema antigo (Supabase) era dividido
| entre `auth.users` (credenciais) e `profiles` (dados de perfil). Aqui é
| a tabela de login de admin/coordenador/produção (técnico tem seu próprio
| mecanismo de sessão, ver "technicians"/"technician_sessions").
|
*/
class UsersSchema extends Schema {
  up() {
    this.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('email', 150).nullable().unique()
      table.string('username', 60).nullable().unique()
      table.string('password_hash', 180).notNullable()
      table.string('full_name', 150).notNullable()
      table.string('cargo', 100).nullable()
      table.enu('status', ['ativo', 'inativo']).notNullable().defaultTo('ativo')
      table.string('matricula', 40).nullable()

      table
        .integer('sector_id')
        .unsigned()
        .references('id')
        .inTable('sectors')
        .onDelete('set null')
        .nullable()

      table.enu('turno', ['manha', 'tarde', 'noite']).nullable()
      table.boolean('email_confirmed').notNullable().defaultTo(true)
      table.boolean('banned').notNullable().defaultTo(false)
      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('users')
  }
}

module.exports = UsersSchema
