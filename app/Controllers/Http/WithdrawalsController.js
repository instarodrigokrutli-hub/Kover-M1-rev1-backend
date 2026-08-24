'use strict'

const Database = use('Adonis/Lucid/Database')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const AuditLogger = require('../../Services/AuditLogger')
const CreateWithdrawal = require('../../Validators/CreateWithdrawal')

class WithdrawalsController {
  // POST /withdrawals
  async store(ctx) {
    const { request, response, technician } = ctx
    const { material_id, quantity, notes } = await request.validate(CreateWithdrawal)

    const material = await Material.find(material_id)
    if (!material || material.status !== 'ativo') {
      return response.status(404).json({ message: 'Material não encontrado ou inativo.' })
    }

    if (Number(material.quantity) < quantity) {
      return response.status(422).json({ message: 'Estoque insuficiente.' })
    }

    const trx = await Database.transaction()
    try {
      material.useTransaction(trx)
      material.quantity = Number(material.quantity) - quantity
      await material.save()

      const movement = await StockMovement.create(
        {
          material_id: material.id,
          type: 'retirada',
          quantity,
          unit_value_snapshot: material.unit_value,
          total_value: material.unit_value * quantity,
          technician_id: technician.id,
          notes: notes || null,
        },
        { client: trx }
      )

      await trx.commit()

      await AuditLogger.log(ctx, {
        action: 'WITHDRAWAL',
        entityType: 'materials',
        entityId: material.id,
        details: { quantity },
      })

      return response.status(201).json(movement)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // GET /withdrawals/mine
  async mine({ technician, request }) {
    const { page = 1, perPage = 30 } = request.qs()
    return StockMovement.query()
      .where('technician_id', technician.id)
      .where('type', 'retirada')
      .preload('material')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
  }
}

module.exports = WithdrawalsController
