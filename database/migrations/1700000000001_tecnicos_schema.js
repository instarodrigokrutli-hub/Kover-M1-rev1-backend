'use strict'

const Schema = use('Adonis/Lucid/Schema')

/*
|--------------------------------------------------------------------------
| database/migrations/..._tecnicos_schema.js
|--------------------------------------------------------------------------
|
| Uma migration descreve, em código, como criar/alterar uma tabela.
| Isso substitui rodar SQL "na mão": o time inteiro roda o mesmo
| histórico de mudanças com "node ace migration:run".
|
| O prefixo numérico no nome do arquivo (1700000000001_...) define a
| ORDEM de execução — por isso o próximo módulo que você criar deve
| ter um número maior que o anterior (o "node ace make:migration"
| já gera isso automaticamente, baseado no timestamp atual).
|
*/
class TecnicosSchema extends Schema {
  up() {
    this.schema.createTable('tecnicos', (table) => {
      table.increments('id')
      table.string('nome', 120).notNullable()
      table.string('email', 120).notNullable().unique()
      table.string('telefone', 20).nullable()
      table.string('matricula', 40).nullable().unique()
      table.boolean('ativo').notNullable().defaultTo(true)
      table.timestamps()
    })
  }

  down() {
    this.schema.dropTable('tecnicos')
  }
}

module.exports = TecnicosSchema
