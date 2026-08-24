'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/TechnicianCode.js
|--------------------------------------------------------------------------
|
| Hash do código numérico de acesso do técnico. PBKDF2-SHA256, 100k
| iterações, salt aleatório — mesmo algoritmo usado no sistema de
| referência (lá era Web Crypto no browser; aqui é o `crypto` nativo
| do Node, servidor). Formato próprio, sem necessidade de compatibilidade
| retroativa (banco novo, sem dados herdados).
|
*/

const crypto = require('crypto')

const ITERATIONS = 100000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

function hash(code) {
  const salt = crypto.randomBytes(16)
  const derived = crypto.pbkdf2Sync(String(code), salt, ITERATIONS, KEY_LENGTH, DIGEST)
  return `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${derived.toString('base64')}`
}

function verify(code, storedHash) {
  const parts = String(storedHash).split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false

  const iterations = parseInt(parts[1], 10)
  const salt = Buffer.from(parts[2], 'base64')
  const expected = Buffer.from(parts[3], 'base64')

  const derived = crypto.pbkdf2Sync(String(code), salt, iterations, expected.length, DIGEST)
  return crypto.timingSafeEqual(derived, expected)
}

module.exports = { hash, verify }
