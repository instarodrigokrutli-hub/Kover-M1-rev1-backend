'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/SessionToken.js
|--------------------------------------------------------------------------
|
| Token opaco de sessão do técnico: gerado aleatório, só o hash SHA-256
| é armazenado em technician_sessions.token_hash (o valor em si só existe
| no cookie do navegador) — mesma técnica do sistema de referência.
|
*/

const crypto = require('crypto')

function generate() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = { generate, hashToken }
