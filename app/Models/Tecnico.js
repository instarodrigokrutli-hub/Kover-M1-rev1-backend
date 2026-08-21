'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

/*
|--------------------------------------------------------------------------
| app/Models/Tecnico.js
|--------------------------------------------------------------------------
|
| Um "Model" representa UMA TABELA do banco (aqui, "tecnicos").
|
| O Lucid do AdonisJS 5 normalmente declara colunas e relacionamentos com
| decorators (@column, @hasMany), o que exige TypeScript. Em JavaScript
| puro, o mesmo resultado é obtido chamando $addColumn/$addRelation
| dentro de boot() — é a própria API interna que os decorators usam.
|
*/
class Tecnico extends BaseModel {
  static boot() {
    super.boot()

    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('nome', {})
    this.$addColumn('email', {})
    this.$addColumn('telefone', {})
    this.$addColumn('matricula', {})
    this.$addColumn('ativo', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))

    // Relacionamento: um técnico pode ter várias ordens de serviço.
    this.$addRelation('ordensServico', 'hasMany', () => require('./OrdemServico'), {
      localKey: 'id',
      foreignKey: 'tecnico_id',
    })
  }
}

// Decorators chamam Model.boot() automaticamente ao definir a classe; como
// não há decorators aqui, isso precisa ser feito manualmente.
Tecnico.boot()

module.exports = Tecnico
