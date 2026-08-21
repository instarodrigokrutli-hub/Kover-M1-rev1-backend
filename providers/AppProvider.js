'use strict'

/*
|--------------------------------------------------------------------------
| providers/AppProvider.js
|--------------------------------------------------------------------------
|
| Um Provider é o lugar pra registrar coisas no container do Adonis
| (ex: uma lib externa, um binding customizado) e rodar setup na hora
| que o app sobe. Pra maioria dos módulos de CRUD (controllers,
| models, validators) você NÃO precisa mexer aqui — é só pra
| integrações mais "de infraestrutura".
|
| No AdonisJS 5 um Provider é uma classe simples (sem herdar de nada),
| que recebe a instância da Application no construtor.
|
*/
class AppProvider {
  constructor(app) {
    this.app = app
  }

  register() {
    // this.app.container.singleton('App/Services/AlgumaCoisa', () => new AlgumaCoisa())
  }

  async boot() {
    // Roda depois que todos os providers foram registrados.
  }
}

module.exports = AppProvider
