'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

/*
|--------------------------------------------------------------------------
| app/Models/OrdemServico.js
|--------------------------------------------------------------------------
|
| Representa a tabela "ordens_servicos". Ver app/Models/Tecnico.js para a
| explicação de por que colunas/relacionamentos são declarados em boot()
| em vez de decorators.
|
*/
class OrdemServico extends BaseModel {
  static boot() {
    super.boot()

    // "ordens_servicos" é plural irregular em português; a estratégia
    // padrão do Lucid geraria "ordem_servicos" (pluralização em inglês).
    this.table = 'ordens_servicos'

    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('numero', {})
    this.$addColumn('titulo', {})
    this.$addColumn('descricao', {})
    this.$addColumn('status', {})
    this.$addColumn('prioridade', {})
    this.$addColumn('tecnico_id', {})
    this.$addColumn('data_abertura', dateTimeColumn())
    this.$addColumn('data_conclusao', dateTimeColumn())
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))

    // Relacionamento inverso: uma OS pertence a um técnico.
    this.$addRelation('tecnico', 'belongsTo', () => require('./Tecnico'), {
      localKey: 'id',
      foreignKey: 'tecnico_id',
    })
  }
}

// Decorators chamam Model.boot() automaticamente ao definir a classe; como
// não há decorators aqui, isso precisa ser feito manualmente.
OrdemServico.boot()

module.exports = OrdemServico
