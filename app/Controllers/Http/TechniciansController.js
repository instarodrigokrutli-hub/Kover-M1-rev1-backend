'use strict'

const Technician = require('../../Models/Technician')
const TechnicianCode = require('../../Services/TechnicianCode')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreateTechnician = require('../../Validators/CreateTechnician')
const UpdateTechnician = require('../../Validators/UpdateTechnician')

class TechniciansController {
  // GET /technicians
  async index(ctx) {
    const { request } = ctx
    const { page = 1, perPage = 20, status } = request.qs()

    const query = Technician.query().orderBy('name', 'asc')
    if (status) query.where('status', status)

    return query.paginate(page, perPage)
  }

  // POST /technicians
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const { name, code } = await request.validate(CreateTechnician)

    const technician = await Technician.create({
      name,
      code_hash: TechnicianCode.hash(code),
      status: 'ativo',
      created_by: user.id,
      updated_by: user.id,
    })

    await AuditLogger.log(ctx, {
      action: 'TECHNICIAN_CREATE',
      entityType: 'technicians',
      entityId: technician.id,
    })

    return response.status(201).json(technician)
  }

  // GET /technicians/:id
  async show({ params, response }) {
    const technician = await Technician.find(params.id)
    if (!technician) {
      return response.status(404).json({ message: 'Técnico não encontrado.' })
    }
    return technician
  }

  // PUT /technicians/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const { name, new_code } = await request.validate(UpdateTechnician)

    const technician = await Technician.find(params.id)
    if (!technician) {
      return response.status(404).json({ message: 'Técnico não encontrado.' })
    }

    if (name) technician.name = name
    if (new_code) technician.code_hash = TechnicianCode.hash(new_code)
    technician.updated_by = user.id
    await technician.save()

    await AuditLogger.log(ctx, {
      action: 'TECHNICIAN_UPDATE',
      entityType: 'technicians',
      entityId: technician.id,
    })

    return technician
  }

  // DELETE /technicians/:id — na prática usamos inativação (ver status),
  // mas mantemos a rota apiOnly por convenção do Route.resource.
  async destroy(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const technician = await Technician.find(params.id)
    if (!technician) {
      return response.status(404).json({ message: 'Técnico não encontrado.' })
    }

    const status = request.input('status', 'inativo')
    technician.status = status
    technician.updated_by = user.id
    await technician.save()

    await AuditLogger.log(ctx, {
      action: 'TECHNICIAN_STATUS',
      entityType: 'technicians',
      entityId: technician.id,
      details: { status },
    })

    return response.status(204).send()
  }
}

module.exports = TechniciansController
