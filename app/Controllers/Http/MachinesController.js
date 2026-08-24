'use strict'

const Machine = require('../../Models/Machine')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreateMachine = require('../../Validators/CreateMachine')
const UpdateMachine = require('../../Validators/UpdateMachine')

class MachinesController {
  // GET /machines
  async index({ request }) {
    const { page = 1, perPage = 50, sector, status } = request.qs()
    const query = Machine.query().orderBy('name', 'asc')
    if (sector) query.where('sector', sector)
    if (status) query.where('status', status)
    return query.paginate(page, perPage)
  }

  // POST /machines
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response } = ctx
    const data = await request.validate(CreateMachine)

    if (data.code) {
      const existing = await Machine.query().whereRaw('lower(code) = ?', [data.code.toLowerCase()]).first()
      if (existing) {
        return response.status(422).json({ message: 'Já existe uma máquina com este código.' })
      }
    }

    const machine = await Machine.create({ ...data, status: 'ativo' })

    await AuditLogger.log(ctx, { action: 'MACHINE_CREATE', entityType: 'machines', entityId: machine.id })

    return response.status(201).json(machine)
  }

  // GET /machines/:id
  async show({ params, response }) {
    const machine = await Machine.find(params.id)
    if (!machine) {
      return response.status(404).json({ message: 'Máquina não encontrada.' })
    }
    return machine
  }

  // PUT /machines/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response } = ctx
    const data = await request.validate(UpdateMachine)

    const machine = await Machine.find(params.id)
    if (!machine) {
      return response.status(404).json({ message: 'Máquina não encontrada.' })
    }

    if (data.code) {
      const existing = await Machine.query()
        .whereRaw('lower(code) = ?', [data.code.toLowerCase()])
        .whereNot('id', machine.id)
        .first()
      if (existing) {
        return response.status(422).json({ message: 'Já existe uma máquina com este código.' })
      }
    }

    machine.merge(data)
    await machine.save()

    await AuditLogger.log(ctx, { action: 'MACHINE_UPDATE', entityType: 'machines', entityId: machine.id })

    return machine
  }

  // DELETE /machines/:id -> inativa
  async destroy(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const machine = await Machine.find(params.id)
    if (!machine) {
      return response.status(404).json({ message: 'Máquina não encontrada.' })
    }
    machine.status = 'inativo'
    await machine.save()
    return response.status(204).send()
  }
}

module.exports = MachinesController
