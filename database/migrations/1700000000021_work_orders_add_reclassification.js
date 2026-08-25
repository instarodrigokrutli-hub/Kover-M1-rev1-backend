'use strict'

const Schema = use('Adonis/Lucid/Schema')

const WO_PRIORITY = ['baixa', 'media', 'alta', 'emergencial']

class WorkOrdersAddReclassification extends Schema {
  up() {
    this.schema.table('work_orders', (table) => {
      // Snapshot da prioridade no momento da abertura — nunca muda depois.
      // Comparada com `priority` (atual) pra saber se o técnico reclassificou.
      table.enu('original_priority', WO_PRIORITY).nullable()

      // Classificação Corretiva x Corretiva Programada, decidida só pelo
      // técnico ao concluir a OS — independente de prioridade/urgência.
      // String livre (não enu()) de propósito: evita depender de um CHECK
      // constraint do SQLite, que exigiria recriar a tabela pra ampliar no
      // futuro. Validação dos valores fica na camada de aplicação.
      table.string('corrective_classification', 30).nullable()
    })
  }

  down() {
    this.schema.table('work_orders', (table) => {
      table.dropColumn('original_priority')
      table.dropColumn('corrective_classification')
    })
  }
}

module.exports = WorkOrdersAddReclassification
