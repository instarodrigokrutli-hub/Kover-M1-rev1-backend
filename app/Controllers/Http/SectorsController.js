'use strict'

const Sector = require('../../Models/Sector')
const { assertRole } = require('../../Services/Authorization')
const CreateSector = require('../../Validators/CreateSector')

class SectorsController {
  // GET /sectors
  async index() {
    return Sector.query().where('active', true).orderBy('name', 'asc')
  }

  // POST /sectors
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response } = ctx
    const { name } = await request.validate(CreateSector)
    const sector = await Sector.create({ name })
    return response.status(201).json(sector)
  }

  // GET /sectors/:id
  async show({ params, response }) {
    const sector = await Sector.find(params.id)
    if (!sector) return response.status(404).json({ message: 'Setor não encontrado.' })
    return sector
  }

  // PUT /sectors/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response } = ctx
    const { name } = request.only(['name'])
    const sector = await Sector.find(params.id)
    if (!sector) return response.status(404).json({ message: 'Setor não encontrado.' })
    if (name) sector.name = name
    await sector.save()
    return sector
  }

  // DELETE /sectors/:id -> inativa
  async destroy(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const sector = await Sector.find(params.id)
    if (!sector) return response.status(404).json({ message: 'Setor não encontrado.' })
    sector.active = false
    await sector.save()
    return response.status(204).send()
  }
}

module.exports = SectorsController
