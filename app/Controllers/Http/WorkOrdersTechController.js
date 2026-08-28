'use strict'

const { DateTime } = require('luxon')
const Database = use('Adonis/Lucid/Database')
const WorkOrder = require('../../Models/WorkOrder')
const WorkOrderComment = require('../../Models/WorkOrderComment')
const WorkOrderEvent = require('../../Models/WorkOrderEvent')
const WorkOrderParticipant = require('../../Models/WorkOrderParticipant')
const WorkOrderPause = require('../../Models/WorkOrderPause')
const WorkOrderMaterial = require('../../Models/WorkOrderMaterial')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const WorkOrderChecklistItem = require('../../Models/WorkOrderChecklistItem')
const AuditLogger = require('../../Services/AuditLogger')
const AddWorkOrderMaterial = require('../../Validators/AddWorkOrderMaterial')
const FinishWorkOrder = require('../../Validators/FinishWorkOrder')

const CHECKLIST_STATUSES = ['nao_iniciado', 'em_andamento', 'concluido', 'nao_se_aplica']

const WORKING_STATUSES = ['aceita', 'em_atendimento', 'pausada']
const WO_PRIORITIES = ['baixa', 'media', 'alta', 'emergencial']

async function trackParticipant(workOrder, technician) {
  const now = DateTime.local()
  const existing = await WorkOrderParticipant.query()
    .where('work_order_id', workOrder.id)
    .where('technician_id', technician.id)
    .first()

  if (existing) {
    existing.last_active_at = now
    await existing.save()
  } else {
    await WorkOrderParticipant.create({
      work_order_id: workOrder.id,
      technician_id: technician.id,
      technician_name: technician.name,
      first_joined_at: now,
      last_active_at: now,
    })
  }
}

async function logEvent(workOrder, technician, eventType, message, details = null) {
  await WorkOrderEvent.create({
    work_order_id: workOrder.id,
    technician_id: technician ? technician.id : null,
    technician_name: technician ? technician.name : null,
    event_type: eventType,
    message,
    details,
  })
}

class WorkOrdersTechController {
  // PATCH /work-orders/:id/accept
  async accept(ctx) {
    const { params, response, technician } = ctx
    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })

    if (!['aguardando_atendimento', 'reaberta', 'aceita'].includes(workOrder.status)) {
      return response.status(422).json({ message: 'OS já foi iniciada por outro técnico.' })
    }

    workOrder.status = 'aceita'
    workOrder.technician_id = technician.id
    workOrder.accepted_at = DateTime.local()
    await workOrder.save()

    await trackParticipant(workOrder, technician)
    await logEvent(workOrder, technician, 'accept', `${technician.name} aceitou a OS.`)
    await AuditLogger.log(ctx, { action: 'WO_ACCEPT', entityType: 'work_orders', entityId: workOrder.id })

    return workOrder
  }

  // PATCH /work-orders/:id/take-over
  async takeOver(ctx) {
    const { params, response, technician } = ctx
    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })

    if (!WORKING_STATUSES.includes(workOrder.status)) {
      return response.status(422).json({ message: 'OS não está em atendimento.' })
    }

    const previousTechnicianId = workOrder.technician_id
    workOrder.technician_id = technician.id
    await workOrder.save()

    await trackParticipant(workOrder, technician)
    await logEvent(workOrder, technician, 'take_over', `${technician.name} assumiu a OS.`, {
      previousTechnicianId,
    })
    await AuditLogger.log(ctx, { action: 'WO_TAKE_OVER', entityType: 'work_orders', entityId: workOrder.id })

    return workOrder
  }

  // POST /work-orders/:id/comments
  async addComment(ctx) {
    const { params, request, response, technician } = ctx
    const { comment } = request.only(['comment'])

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    if (!WORKING_STATUSES.includes(workOrder.status)) {
      return response.status(422).json({ message: 'OS não está em atendimento.' })
    }

    const record = await WorkOrderComment.create({
      work_order_id: workOrder.id,
      technician_id: technician.id,
      technician_name: technician.name,
      comment,
    })

    await trackParticipant(workOrder, technician)
    await logEvent(workOrder, technician, 'comment', comment)

    return response.status(201).json(record)
  }

  // PATCH /work-orders/:id/execution
  async updateExecution(ctx) {
    const { params, request, response, technician } = ctx
    const { service_type, comment, priority } = request.only(['service_type', 'comment', 'priority'])

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    if (!['aceita', 'em_atendimento'].includes(workOrder.status)) {
      return response.status(422).json({ message: 'OS precisa estar aceita ou em atendimento.' })
    }

    if (service_type) workOrder.service_type = service_type
    if (comment) workOrder.technician_comment = comment
    if (priority) {
      if (!WO_PRIORITIES.includes(priority)) {
        return response.status(422).json({ message: 'Prioridade inválida.' })
      }
      if (priority !== workOrder.priority) {
        const previousPriority = workOrder.priority
        workOrder.priority = priority
        await AuditLogger.log(ctx, {
          action: 'WO_PRIORITY_RECLASSIFIED',
          entityType: 'work_orders',
          entityId: workOrder.id,
          details: { from: previousPriority, to: priority },
        })
      }
    }
    if (!workOrder.started_at) workOrder.started_at = DateTime.local()
    if (workOrder.status === 'aceita') workOrder.status = 'em_atendimento'
    await workOrder.save()

    await trackParticipant(workOrder, technician)

    return workOrder
  }

  // POST /work-orders/:id/materials
  async addMaterial(ctx) {
    const { params, request, response, technician } = ctx
    const { material_id, quantity } = await request.validate(AddWorkOrderMaterial)

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    if (workOrder.status !== 'em_atendimento') {
      return response.status(422).json({ message: 'OS precisa estar em atendimento.' })
    }

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

      const woMaterial = await WorkOrderMaterial.create(
        {
          work_order_id: workOrder.id,
          material_id: material.id,
          quantity,
          unit_value_snapshot: material.unit_value,
          total_value: material.unit_value * quantity,
          technician_id: technician.id,
        },
        { client: trx }
      )

      await StockMovement.create(
        {
          material_id: material.id,
          type: 'retirada',
          quantity,
          unit_value_snapshot: material.unit_value,
          total_value: material.unit_value * quantity,
          technician_id: technician.id,
          work_order_id: workOrder.id,
        },
        { client: trx }
      )

      await trx.commit()

      await trackParticipant(workOrder, technician)
      await logEvent(workOrder, technician, 'material', `Material ${material.name} adicionado.`, {
        materialId: material.id,
        quantity,
      })

      return response.status(201).json(woMaterial)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // PATCH /work-orders/:id/finish
  async finish(ctx) {
    const { params, request, response, technician } = ctx
    const { service_type, final_comment, corrective_classification } = await request.validate(FinishWorkOrder)

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    if (workOrder.status !== 'em_atendimento') {
      return response.status(422).json({ message: 'OS precisa estar em atendimento.' })
    }

    if (workOrder.maintenance_type === 'preventiva') {
      const pending = await WorkOrderChecklistItem.query()
        .where('work_order_id', workOrder.id)
        .where('required', true)
        .whereNotIn('status', ['concluido', 'nao_se_aplica'])
        .first()
      if (pending) {
        return response.status(422).json({ message: 'Há itens obrigatórios do checklist ainda pendentes.' })
      }
    } else if (!corrective_classification) {
      return response.status(422).json({ message: 'Classifique a OS como Corretiva ou Corretiva Programada.' })
    }

    workOrder.status = 'aguardando_avaliacao'
    workOrder.finished_at = DateTime.local()
    workOrder.technician_id = technician.id
    if (service_type) workOrder.service_type = service_type
    if (final_comment) workOrder.final_comment = final_comment
    workOrder.corrective_classification = corrective_classification
    await workOrder.save()

    await trackParticipant(workOrder, technician)
    await logEvent(workOrder, technician, 'finish', `${technician.name} concluiu o atendimento.`)
    await AuditLogger.log(ctx, { action: 'WO_FINISH', entityType: 'work_orders', entityId: workOrder.id })

    return workOrder
  }

  // PATCH /work-orders/:id/pause
  async pause(ctx) {
    const { params, request, response, technician } = ctx
    const { reason } = request.only(['reason'])

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    if (workOrder.status !== 'em_atendimento') {
      return response.status(422).json({ message: 'OS precisa estar em atendimento.' })
    }

    workOrder.status = 'pausada'
    workOrder.paused_at = DateTime.local()
    await workOrder.save()

    await WorkOrderPause.create({
      work_order_id: workOrder.id,
      technician_id: technician.id,
      reason: reason || 'Sem motivo informado.',
      started_at: DateTime.local(),
    })

    await logEvent(workOrder, technician, 'pause', reason || 'OS pausada.')

    return workOrder
  }

  // PATCH /work-orders/:id/resume
  async resume(ctx) {
    const { params, response, technician } = ctx

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    if (workOrder.status !== 'pausada') {
      return response.status(422).json({ message: 'OS não está pausada.' })
    }

    const openPause = await WorkOrderPause.query()
      .where('work_order_id', workOrder.id)
      .whereNull('ended_at')
      .orderBy('started_at', 'desc')
      .first()

    const now = DateTime.local()
    if (openPause) {
      const elapsedSeconds = now.diff(openPause.started_at, 'seconds').seconds
      workOrder.total_paused_seconds = (workOrder.total_paused_seconds || 0) + Math.round(elapsedSeconds)
      openPause.ended_at = now
      await openPause.save()
    }

    workOrder.status = 'em_atendimento'
    workOrder.paused_at = null
    await workOrder.save()

    await logEvent(workOrder, technician, 'resume', `${technician.name} retomou o atendimento.`)

    return workOrder
  }

  // PATCH /work-orders/:id/checklist/:itemId
  async updateChecklistItem(ctx) {
    const { params, request, response, technician } = ctx
    const { status } = request.only(['status'])
    if (!CHECKLIST_STATUSES.includes(status)) {
      return response.status(422).json({ message: 'Status de checklist inválido.' })
    }

    const item = await WorkOrderChecklistItem.query()
      .where('id', params.itemId)
      .where('work_order_id', params.id)
      .first()
    if (!item) return response.status(404).json({ message: 'Item do checklist não encontrado.' })

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder || !WORKING_STATUSES.includes(workOrder.status)) {
      return response.status(422).json({ message: 'OS não está em atendimento.' })
    }

    item.status = status
    item.technician_id = technician.id
    item.technician_name = technician.name
    await item.save()

    await trackParticipant(workOrder, technician)
    await logEvent(workOrder, technician, 'checklist', `${technician.name} atualizou o item "${item.description}" do checklist.`, {
      itemId: item.id,
      status,
    })

    return item
  }
}

module.exports = WorkOrdersTechController
