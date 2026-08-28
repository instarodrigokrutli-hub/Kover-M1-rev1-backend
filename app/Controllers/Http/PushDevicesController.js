'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/PushDevicesController.js
|--------------------------------------------------------------------------
|
| Registro de dispositivos Push (Fase 2, migrado do Supabase). Réplica
| fiel de src/lib/push.functions.ts — endpoints públicos (sem exigir auth),
| igual ao original: o registro de device não fica vinculado a um usuário.
|
*/

const { DateTime } = require('luxon')
const PushDevice = require('../../Models/PushDevice')
const Push = require('../../Services/Push')

class PushDevicesController {
  // POST /push-devices
  async store({ request, response }) {
    const { token, device_name, platform = 'web' } = request.only(['token', 'device_name', 'platform'])
    if (!token || String(token).length < 20) {
      return response.status(422).json({ ok: false, message: 'Token inválido.' })
    }

    const existing = await PushDevice.query().where('token', token).first()
    if (existing) {
      existing.device_name = device_name ?? null
      existing.platform = platform
      existing.active = true
      existing.last_seen_at = DateTime.local()
      await existing.save()
    } else {
      await PushDevice.create({
        token, device_name: device_name ?? null, platform, active: true, last_seen_at: DateTime.local(),
      })
    }
    return { ok: true }
  }

  // POST /push-devices/disable
  async disable({ request }) {
    const { token } = request.only(['token'])
    const device = await PushDevice.query().where('token', token).first()
    if (device) {
      device.active = false
      await device.save()
    }
    return { ok: true }
  }

  // GET /push-devices/test-service-account
  async testServiceAccount() {
    return Push.testServiceAccount()
  }
}

module.exports = PushDevicesController
