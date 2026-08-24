'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/Jwt.js
|--------------------------------------------------------------------------
|
| Emissão/verificação de JWT para admin/coordenador/produção (substitui
| o Supabase Auth). Técnico usa outro mecanismo (ver TechnicianAuth.js).
|
*/

const jwt = require('jsonwebtoken')
const Env = use('Adonis/Core/Env')

const SECRET = Env.get('APP_KEY')
const EXPIRES_IN = '12h'

function sign(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN })
}

function verify(token) {
  try {
    const payload = jwt.verify(token, SECRET)
    return payload.sub
  } catch (error) {
    return null
  }
}

module.exports = { sign, verify }
