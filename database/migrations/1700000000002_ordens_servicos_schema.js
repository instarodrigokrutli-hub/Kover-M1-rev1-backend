'use strict'

const Schema = use('Schema')

class OrdensServicosSchema extends Schema {
  up() {
    this.create('ordens_servicos', (table) => {
      table.increments('id')
      table.string('numero', 30).notNullable().unique()
      table.string('titulo', 150).notNullable()
      table.text('descricao').nullable()

      table
        .enu('status', ['aberta', 'em_andamento', 'concluida', 'cancelada'])
        .notNullable()
        .defaultTo('aberta')

      table
        .enu('prioridade', ['baixa', 'media', 'alta', 'urgente'])
        .notNullable()
        .defaultTo('media')

      // Chave estrangeira -> tabela "tecnicos".
      table
        .integer('tecnico_id')
        .unsigned()
        .references('id')
        .inTable('tecnicos')
        .onDelete('set null')
        .nullable()

      table.timestamp('data_abertura').notNullable()
      table.timestamp('data_conclusao').nullable()

      table.timestamps()
    })
  }

  down() {
    this.drop('ordens_servicos')
  }
}

module.exports = OrdensServicosSchema
