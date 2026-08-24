'use strict'

const { DateTime } = require('luxon')
const Database = use('Adonis/Lucid/Database')
const InternalWorkOrder = require('../../Models/InternalWorkOrder')
const InternalWoMaterial = require('../../Models/InternalWoMaterial')
const Machine = require('../../Models/Machine')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const AuditLogger = require('../../Services/AuditLogger')
const CreateInternalWorkOrder = require('../../Validators/CreateInternalWorkOrder')

async function ensureMachine(data) {
  if (data.machine_id) return Machine.find(data.machine_id)
  if (!data.machine_name) return null

  const existing = await Machine.query()
    .whereRaw('lower(name) = ?', [data.machine_name.toLowerCase()])
    .first()
  if (existing) return existing

  return Machine.create({ name: data.machine_name, sector: data.sector, status: 'ativo' })
}

class InternalWorkOrdersController {
  // GET /internal-work-orders — só as próprias do técnico logado.
  async index({ request, technician }) {
    const { page = 1, perPage = 20 } = request.qs()
    return InternalWorkOrder.query()
      .where('technician_id', technician.id)
      .preload('machine')
      .preload('materials', (q) => q.preload('material'))
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
  }

  // POST /internal-work-orders — criada já concluída, com materiais
  // consumidos atomicamente (transação substitui o rollback manual
  // do sistema de referência).
  async store(ctx) {
    const { request, response, technician } = ctx
    const data = await request.validate(CreateInternalWorkOrder)

    const machine = await ensureMachine(data)
    if (!machine) {
      return response.status(422).json({ message: 'Informe machine_id ou machine_name.' })
    }

    const materialsInput = data.materials || []
    const materialsById = new Map()
    for (const item of materialsInput) {
      const material = await Material.find(item.material_id)
      if (!material || material.status !== 'ativo') {
        return response.status(404).json({ message: 'Material não encontrado ou inativo.' })
      }
      if (Number(material.quantity) < item.quantity) {
        return response
          .status(422)
          .json({ message: `Estoque insuficiente para o material ${material.name}.` })
      }
      materialsById.set(item.material_id, material)
    }

    const trx = await Database.transaction()
    try {
      const internalWorkOrder = await InternalWorkOrder.create(
        {
          origin: 'manutencao',
          machine_id: machine.id,
          sector: data.sector,
          technician_id: technician.id,
          opened_at: DateTime.local(),
          service_type: data.service_type,
          description: data.description,
          technician_comment: data.technician_comment || null,
          started_at: data.started_at || null,
          finished_at: data.finished_at || DateTime.local(),
          status: 'concluida',
        },
        { client: trx }
      )

      for (const item of materialsInput) {
        const material = materialsById.get(item.material_id)
        material.useTransaction(trx)
        material.quantity = Number(material.quantity) - item.quantity
        await material.save()

        await InternalWoMaterial.create(
          {
            internal_wo_id: internalWorkOrder.id,
            material_id: material.id,
            quantity: item.quantity,
            unit_value_snapshot: material.unit_value,
            total_value: material.unit_value * item.quantity,
          },
          { client: trx }
        )

        await StockMovement.create(
          {
            material_id: material.id,
            type: 'retirada',
            quantity: item.quantity,
            unit_value_snapshot: material.unit_value,
            total_value: material.unit_value * item.quantity,
            technician_id: technician.id,
            internal_wo_id: internalWorkOrder.id,
            notes: `OS interna ${internalWorkOrder.code || '#' + internalWorkOrder.id}`,
          },
          { client: trx }
        )
      }

      await trx.commit()

      await AuditLogger.log(ctx, {
        action: 'INTERNAL_WO_CREATE',
        entityType: 'internal_work_orders',
        entityId: internalWorkOrder.id,
      })

      return response.status(201).json(internalWorkOrder)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // GET /internal-work-orders/:id
  async show({ params, response, technician }) {
    const internalWorkOrder = await InternalWorkOrder.query()
      .where('id', params.id)
      .preload('machine')
      .preload('materials', (q) => q.preload('material'))
      .first()

    if (!internalWorkOrder) {
      return response.status(404).json({ message: 'OS interna não encontrada.' })
    }
    if (internalWorkOrder.technician_id !== technician.id) {
      return response.status(403).json({ message: 'Acesso negado.' })
    }

    return internalWorkOrder
  }
}

module.exports = InternalWorkOrdersController
