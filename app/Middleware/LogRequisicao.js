'use strict'

/*
|--------------------------------------------------------------------------
| app/Middleware/LogRequisicao.js
|--------------------------------------------------------------------------
|
| Exemplo de middleware CUSTOM (feito por vocês, não vem de um pacote).
| Todo middleware tem um método handle(ctx, next):
|   - o que vem ANTES de "await next()" roda antes do controller
|   - o que vem DEPOIS de "await next()" roda depois do controller
|
| Pra ativar, registre em start/kernel.js:
|   - como global: adiciona em globalMiddleware
|   - como nomeado: adiciona em namedMiddleware e usa
|     Route.get(...).middleware(['logRequisicao']) na rota desejada
|
*/
class LogRequisicao {
  async handle({ request }, next) {
    const inicio = Date.now()

    await next()

    const duracaoMs = Date.now() - inicio
    console.log(`${request.method()} ${request.url()} - ${duracaoMs}ms`)
  }
}

module.exports = LogRequisicao
