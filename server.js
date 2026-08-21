/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| Este é o arquivo que efetivamente "liga" o servidor HTTP.
| Rodar `node server.js` (ou `npm start`) sobe a API.
|
| Ele carrega o Ignitor (o "bootstrap" do Adonis), que por sua vez:
|   1. Lê o .env
|   2. Registra os "providers" (config, banco, cors, etc)
|   3. Carrega os "preloads" (start/routes.js e start/kernel.js)
|   4. Sobe o servidor HTTP na porta definida em HOST/PORT
|
*/

require('reflect-metadata')
require('source-map-support').install({ handleUncaughtExceptions: false })

const { Ignitor } = require('@adonisjs/core/build/src/Ignitor')

new Ignitor(__dirname).httpServer().start()
