'use strict'

/*
|--------------------------------------------------------------------------
| config/bodyparser.js
|--------------------------------------------------------------------------
|
| Controla como o Adonis lê o corpo (body) das requisições:
| JSON, formulários e upload de arquivos.
|
*/

module.exports = {
  parse: ['json', 'form'],

  json: {
    types: ['application/json', 'application/json; charset=utf-8'],
    limit: '1mb',
  },

  form: {
    types: ['application/x-www-form-urlencoded'],
    limit: '1mb',
  },

  files: {
    types: ['multipart/form-data'],
    limit: '20mb',
  },
}
