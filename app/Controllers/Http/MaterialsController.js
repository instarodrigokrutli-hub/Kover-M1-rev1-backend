'use strict'

const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const { assertRole, hasRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const CreateMaterial = require('../../Validators/CreateMaterial')
const UpdateMaterial = require('../../Validators/UpdateMaterial')

function generateCode() {
  return String(Math.floor(Math.random() * 90000) + 10000)
}

class MaterialsController {
  // GET /materials — admin vê unit_value, técnico não.
  async index(ctx) {
    const { request } = ctx
    const { page = 1, perPage = 50, category_id, status } = request.qs()

    const query = Material.query().preload('category').orderBy('name', 'asc')
    if (category_id) query.where('category_id', category_id)

    if (ctx.technician && !ctx.user) {
      query.where('status', 'ativo')
    } else if (status) {
      query.where('status', status)
    }

    const materials = await query.paginate(page, perPage)
    const json = materials.toJSON()

    if (!hasRole(ctx, ['admin', 'coordenador', 'producao'])) {
      json.data = json.data.map(({ unit_value, ...rest }) => rest)
    }

    return json
  }

  // POST /materials
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const data = await request.validate(CreateMaterial)

    let code = data.code
    if (!code) {
      for (let i = 0; i < 30; i++) {
        const candidate = generateCode()
        const exists = await Material.query().where('code', candidate).first()
        if (!exists) {
          code = candidate
          break
        }
      }
    } else {
      const exists = await Material.query().where('code', code).first()
      if (exists) {
        return response.status(422).json({ message: 'Já existe um material com este código.' })
      }
    }

    // Regra fiel ao sistema de referência: criar material NUNCA entra
    // com estoque > 0 — quantidade inicial só via ajuste/inventário.
    const material = await Material.create({
      ...data,
      code,
      quantity: 0,
      status: 'ativo',
      created_by: user.id,
      updated_by: user.id,
    })

    await AuditLogger.log(ctx, { action: 'MATERIAL_CREATE', entityType: 'materials', entityId: material.id })

    return response.status(201).json(material)
  }

  // GET /materials/:id
  async show({ params, response }) {
    const material = await Material.query().where('id', params.id).preload('category').first()
    if (!material) return response.status(404).json({ message: 'Material não encontrado.' })
    return material
  }

  // PUT /materials/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const data = await request.validate(UpdateMaterial)

    const material = await Material.find(params.id)
    if (!material) return response.status(404).json({ message: 'Material não encontrado.' })

    material.merge(data)
    material.updated_by = user.id
    await material.save()

    await AuditLogger.log(ctx, { action: 'MATERIAL_UPDATE', entityType: 'materials', entityId: material.id })

    return material
  }

  // DELETE /materials/:id — cascata em stock_movements, réplica fiel.
  async destroy(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const material = await Material.find(params.id)
    if (!material) return response.status(404).json({ message: 'Material não encontrado.' })

    const deletedMovements = await StockMovement.query().where('material_id', material.id).delete()
    await material.delete()

    await AuditLogger.log(ctx, {
      action: 'MATERIAL_DELETE',
      entityType: 'materials',
      entityId: params.id,
      details: { deletedMovements },
    })

    return response.status(204).send()
  }

  // POST /materials/bulk-import
  async bulkImport(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const { rows = [], dryRun = true } = request.only(['rows', 'dryRun'])

    const results = []
    const seenCodes = new Set()

    for (const row of rows) {
      const errors = []
      if (!row.name) errors.push('nome obrigatório')
      if (!row.code) errors.push('código obrigatório')
      if (row.code && seenCodes.has(row.code)) errors.push('código duplicado no lote')
      if (!(row.quantity > 0)) errors.push('quantidade deve ser > 0')

      if (row.code) {
        const exists = await Material.query().where('code', row.code).first()
        if (exists) errors.push('código já existe no banco')
      }

      if (errors.length) {
        results.push({ row, ok: false, errors })
      } else {
        seenCodes.add(row.code)
        results.push({ row, ok: true })
      }
    }

    const hasFailures = results.some((r) => !r.ok)
    if (dryRun || hasFailures) {
      return response.json({ committed: false, results })
    }

    for (const { row } of results) {
      const material = await Material.create({
        code: row.code,
        name: row.name,
        category_id: row.category_id,
        unit: row.unit,
        quantity: row.quantity,
        unit_value: row.unit_value || 0,
        status: 'ativo',
        created_by: user.id,
        updated_by: user.id,
      })
      await StockMovement.create({
        material_id: material.id,
        type: 'inventario_inicial',
        quantity: row.quantity,
        unit_value_snapshot: row.unit_value || 0,
        total_value: (row.unit_value || 0) * row.quantity,
        performed_by_user: user.id,
      })
    }

    return response.json({ committed: true, results })
  }
}

module.exports = MaterialsController
