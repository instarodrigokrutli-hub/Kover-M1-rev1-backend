'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/Push.js
|--------------------------------------------------------------------------
|
| Envio de Push via Firebase Cloud Messaging (HTTP v1) — réplica de
| src/lib/push.server.ts, agora rodando no Adonis (sem depender de Web
| Crypto do browser: usa jsonwebtoken, já uma dependência do projeto).
| Se as credenciais não estiverem configuradas, tudo vira no-op silencioso.
|
*/

const jwt = require('jsonwebtoken')
const Env = use('Adonis/Core/Env')
const PushDevice = require('../Models/PushDevice')
const UserRole = require('../Models/UserRole')

function readServiceAccount() {
  const raw = Env.get('FIREBASE_SERVICE_ACCOUNT_JSON', null)
  if (!raw) return null
  try {
    const sa = JSON.parse(raw)
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null
    return { ...sa, private_key: sa.private_key.replace(/\\n/g, '\n') }
  } catch (e) {
    console.error('[push] FIREBASE_SERVICE_ACCOUNT_JSON inválido', e)
    return null
  }
}

let cachedToken = null

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value

  const assertion = jwt.sign(
    { scope: 'https://www.googleapis.com/auth/firebase.messaging' },
    sa.private_key,
    { algorithm: 'RS256', issuer: sa.client_email, audience: 'https://oauth2.googleapis.com/token', expiresIn: '1h' }
  )

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    console.error('[push] falha ao obter access token', res.status, await res.text())
    return null
  }
  const json = await res.json()
  cachedToken = { value: json.access_token, exp: now + (json.expires_in ?? 3600) }
  return json.access_token
}

const ROLE_BY_PROFILE = { pcm: 'admin', coordenador: 'coordenador', producao: 'producao' }

async function resolveDevices(profiles) {
  const all = await PushDevice.query().where('active', true).limit(1000)
  if (!profiles) return all
  if (profiles.length === 0) return []

  const roles = profiles.map((p) => ROLE_BY_PROFILE[p]).filter(Boolean)
  let allowedUsers = new Set()
  if (roles.length > 0) {
    const ur = await UserRole.query().whereIn('role', roles)
    allowedUsers = new Set(ur.map((r) => r.user_id))
  }
  const techAllowed = profiles.includes('tecnico')

  return all.filter((d) => {
    if (d.technician_id) return techAllowed
    if (d.user_id) return allowedUsers.has(d.user_id)
    return true
  })
}

async function testServiceAccount() {
  const sa = readServiceAccount()
  if (!sa) return { ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON não configurado ou inválido.' }
  const token = await getAccessToken(sa)
  if (!token) return { ok: false, projectId: sa.project_id, error: 'Não foi possível obter access token do Google.' }
  return { ok: true, projectId: sa.project_id }
}

async function sendPushToActiveDevices(msg) {
  const sa = readServiceAccount()
  if (!sa) return 0

  const list = await resolveDevices(msg.profiles ?? null)
  if (list.length === 0) return 0

  const accessToken = await getAccessToken(sa)
  if (!accessToken) return 0

  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  let sent = 0
  const stale = []

  for (const device of list) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: { title: msg.title, body: msg.body },
            data: { link: msg.link, ...(msg.data ?? {}) },
            webpush: {
              fcm_options: { link: msg.link },
              notification: { icon: '/icons/icon-192x192.png', badge: '/icons/icon-192x192.png' },
            },
            android: { priority: 'high' },
          },
        }),
      })
      if (res.ok) sent += 1
      else {
        const txt = await res.text()
        if (res.status === 404 || res.status === 400 || txt.includes('UNREGISTERED')) {
          stale.push(device.id)
        }
        console.error('[push] envio falhou', res.status, txt)
      }
    } catch (e) {
      console.error('[push] envio falhou', e)
    }
  }

  if (stale.length > 0) {
    await PushDevice.query().whereIn('id', stale).update({ active: false })
  }

  return sent
}

module.exports = { testServiceAccount, sendPushToActiveDevices }
