'use strict'

const Sector = require('../../Models/Sector')
const { assertRole } = require('../../Services/Authorization')
const CreateSector = require('../../Validators/CreateSector')

class SectorsController {
  // GET /sectors — por padrão lista todos (admin precisa ver inativos para
  // poder reativar); passe ?active=true para filtrar só os ativos (dropdowns).
  async index({ request }) {
    const { active } = request.qs()
    const query = Sector.query().orderBy('name', 'asc')
    if (active !== undefined) query.where('active', active === 'true' || active === '1')
    return query
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
    const { name, active } = request.only(['name', 'active'])
    const sector = await Sector.find(params.id)
    if (!sector) return response.status(404).json({ message: 'Setor não encontrado.' })
    if (name) sector.name = name
    if (active !== undefined) sector.active = active
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
