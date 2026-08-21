'use strict'

const Model = use('Model')

/*
|--------------------------------------------------------------------------
| app/Models/OrdemServico.js
|--------------------------------------------------------------------------
|
| Representa a tabela "ordens_servicos" (plural automático do Lucid
| a partir do nome da classe "OrdemServico").
|
*/
class OrdemServico extends Model {
  // Relacionamento inverso: uma OS pertence a um técnico.
  tecnico() {
    return this.belongsTo('App/Models/Tecnico', 'tecnico_id', 'id')
  }

  // "Query scope": um atalho reutilizável de filtro.
  // Uso: OrdemServico.query().abertas().fetch()
  static scopeAbertas(query) {
    return query.where('status', 'aberta')
  }
}

module.exports = OrdemServico
