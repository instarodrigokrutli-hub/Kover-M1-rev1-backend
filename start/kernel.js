'use strict'

/*
|--------------------------------------------------------------------------
| start/kernel.js
|--------------------------------------------------------------------------
|
| Aqui é onde o "meio de campo" das requisições é configurado: os
| MIDDLEWARES. Um middleware é uma função que roda ANTES (ou depois)
| do controller — serve pra coisas como CORS, autenticação, logs, etc.
|
| Existem 3 tipos:
|
|   globalMiddleware  -> roda em TODA requisição, sempre.
|   namedMiddleware    -> só roda quando a rota pede (ex: rota.middleware(['auth'])).
|   serverMiddleware   -> roda antes até de chegar no roteador (nível mais baixo).
|
*/

const Server = use('Server')

const globalMiddleware = [
  'Adonis/Middleware/BodyParser',
  'Adonis/Middleware/Cors',
]

const namedMiddleware = {
  // Exemplo: quando o pacote @adonisjs/auth estiver instalado, você
  // pode ativar autenticação numa rota com router.middleware(['auth']).
  // auth: 'Adonis/Middleware/Auth',
}

const serverMiddleware = []

Server.registerGlobal(globalMiddleware)
  .registerNamed(namedMiddleware)
  .use(serverMiddleware)
