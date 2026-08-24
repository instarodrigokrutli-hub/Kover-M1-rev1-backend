'use strict'

const Database = use('Adonis/Lucid/Database')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const { assertRole } = require('../../Services/Authorization')
const AuditLogger = require('../../Services/AuditLogger')
const StockAdjustment = require('../../Validators/StockAdjustment')

class StockController {
  // GET /stock/movements
  async index({ request }) {
    const { page = 1, perPage = 30, material_id } = request.qs()
    const query = StockMovement.query()
      .preload('material')
      .preload('technician')
      .orderBy('created_at', 'desc')
    if (material_id) query.where('material_id', material_id)
    return query.paginate(page, perPage)
  }

  // POST /stock/adjust
  async adjust(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const data = await request.validate(StockAdjustment)

    if (data.type === 'ajuste_entrada') {
      const hasJustification = data.justification && data.justification.trim().length >= 10
      if (!data.nf_number && !data.oc_number && !hasJustification) {
        return response.status(422).json({
          message: 'Informe nota fiscal, ordem de compra ou justificativa (mín. 10 caracteres).',
        })
      }
    }

    const material = await Material.find(data.material_id)
    if (!material) {
      return response.status(404).json({ message: 'Material não encontrado.' })
    }

    const delta = data.type === 'ajuste_entrada' ? data.quantity : -data.quantity
    const newQuantity = Number(material.quantity) + delta
    if (newQuantity < 0) {
      return response.status(422).json({ message: 'Ajuste deixaria o estoque negativo.' })
    }

    const trx = await Database.transaction()
    try {
      material.useTransaction(trx)
      material.quantity = newQuantity
      await material.save()

      const movement = await StockMovement.create(
        {
          material_id: material.id,
          type: data.type,
          quantity: data.quantity,
          unit_value_snapshot: material.unit_value,
          total_value: material.unit_value * data.quantity,
          performed_by_user: user.id,
          nf_number: data.nf_number || null,
          oc_number: data.oc_number || null,
          justification: data.justification || null,
        },
        { client: trx }
      )

      await trx.commit()

      await AuditLogger.log(ctx, {
        action: data.type === 'ajuste_entrada' ? 'STOCK_ADJUST_IN' : 'STOCK_ADJUST_OUT',
        entityType: 'materials',
        entityId: material.id,
        details: { quantity: data.quantity },
      })

      return response.status(201).json(movement)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}

module.exports = StockController
