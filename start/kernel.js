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
|
*/

const Server = use('Adonis/Core/Server')

// Em TypeScript isso normalmente é `() => import('@ioc:Adonis/Core/BodyParser')`
// (o `@ioc:` é reescrito pelo compilador). Em JS puro, o mesmo formato "lazy
// import" (função que resolve pra { default: Classe }) é escrito à mão — é o
// único jeito da classe ser instanciada corretamente pelo container.
const globalMiddleware = [
  () => Promise.resolve({ default: use('Adonis/Core/BodyParser') }),
]

const namedMiddleware = {
  // Exemplo: quando o pacote @adonisjs/auth estiver instalado, você
  // pode ativar autenticação numa rota com router.middleware(['auth']).
  // auth: 'Adonis/Middleware/Auth',
}

Server.middleware.register(globalMiddleware)
Server.middleware.registerNamed(namedMiddleware)
