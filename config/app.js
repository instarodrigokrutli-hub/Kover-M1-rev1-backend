'use strict'

/*
|--------------------------------------------------------------------------
| config/app.js
|--------------------------------------------------------------------------
|
| Configurações gerais do app: chave de criptografia, http, logger.
| Os valores "reais" vêm do .env (veja o Env.get abaixo) — isso evita
| deixar segredo/config sensível direto no código.
|
*/

const Env = use('Env')

module.exports = {
  name: Env.get('APP_NAME', 'kover-manutencao-backend'),

  // Usada para assinar cookies, sessões, etc. Gere uma com:
  //   node ace generate:key
  appKey: Env.get('APP_KEY'),

  http: {
    allowMethodSpoofing: false,
    subdomainOffset: 2,
    trustProxy: require('proxy-addr').compile('loopback'),
  },

  logger: {
    transport: 'console',
    console: {
      driver: 'console',
    },
  },
}
