'use strict'

/*
|--------------------------------------------------------------------------
| config/cors.js
|--------------------------------------------------------------------------
|
| Libera o frontend (React/Vite) a chamar esta API de outra origem/porta.
| Em produção, troque "origin: true" pela URL exata do seu frontend.
|
*/

module.exports = {
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
}
