'use strict'

const Model = use('Model')

/*
|--------------------------------------------------------------------------
| app/Models/Tecnico.js
|--------------------------------------------------------------------------
|
| Um "Model" representa UMA TABELA do banco. Aqui, por padrão, essa
| classe representa a tabela "tecnicos" (o Lucid pluraliza e deixa
| minúsculo o nome da classe automaticamente — não precisa configurar).
|
| Não existem decorators nem "schema" declarado aqui: as colunas vêm
| direto da tabela (veja database/migrations/..._tecnicos_schema.js).
| Isso que faz esse estilo funcionar em JavaScript puro, sem TypeScript.
|
*/
class Tecnico extends Model {
  // Timestamps automáticos: o Lucid preenche created_at/updated_at
  // sozinho ao salvar (createdAtColumn/updatedAtColumn já são o padrão).

  // Relacionamento: um técnico pode ter várias ordens de serviço.
  ordensServico() {
    return this.hasMany('App/Models/OrdemServico', 'id', 'tecnico_id')
  }
}

module.exports = Tecnico
