'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/UnitsController.js
|--------------------------------------------------------------------------
|
| Cadastro de Unidades (Fase 2, migrado do Supabase). Réplica fiel de
| src/lib/units.functions.ts.
|
*/

const Unit = require('../../Models/Unit')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreateUnit = require('../../Validators/CreateUnit')
const UpdateUnit = require('../../Validators/UpdateUnit')

class UnitsController {
  // GET /units
  async index() {
    return Unit.query().orderBy('code', 'asc')
  }

  // POST /units
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response } = ctx
    const data = await request.validate(CreateUnit)
    const code = data.code.toUpperCase()

    const dup = await Unit.find(code)
    if (dup) return response.status(422).json({ message: 'Já existe uma unidade com este código.' })

    const unit = new Unit()
    unit.code = code
    unit.label = data.label
    unit.allows_decimal = data.allows_decimal
    unit.active = true
    await unit.save()

    await AuditLogger.log(ctx, { action: 'UNIT_CREATE', entityType: 'unit', entityId: code, details: data })
    return response.status(201).json({ ok: true })
  }

  // PUT /units/:code
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response } = ctx
    const data = await request.validate(UpdateUnit)

    const unit = await Unit.find(data.code)
    if (!unit) return response.status(404).json({ message: 'Unidade não encontrada.' })

    unit.label = data.label
    unit.allows_decimal = data.allows_decimal
    unit.active = data.active
    await unit.save()

    await AuditLogger.log(ctx, { action: 'UNIT_UPDATE', entityType: 'unit', entityId: data.code, details: data })
    return { ok: true }
  }
}

module.exports = UnitsController
