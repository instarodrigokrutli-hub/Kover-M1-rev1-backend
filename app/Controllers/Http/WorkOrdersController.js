'use strict'

const { DateTime } = require('luxon')
const WorkOrder = require('../../Models/WorkOrder')
const Machine = require('../../Models/Machine')
const Sector = require('../../Models/Sector')
const AuditLogger = require('../../Services/AuditLogger')
const CreateWorkOrder = require('../../Validators/CreateWorkOrder')
const EvaluateWorkOrder = require('../../Validators/EvaluateWorkOrder')

class WorkOrdersController {
  // GET /work-orders — status aceita lista separada por vírgula (ex.: "aceita,em_atendimento,pausada").
  async index({ request }) {
    const { page = 1, perPage = 20, status, requester_user_id, from, to } = request.qs()

    const query = WorkOrder.query().preload('machine').preload('technician').orderBy('created_at', 'desc')
    if (status) {
      const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean)
      if (statuses.length > 1) query.whereIn('status', statuses)
      else if (statuses.length === 1) query.where('status', statuses[0])
    }
    if (requester_user_id) query.where('requester_user_id', requester_user_id)
    if (from) query.where('opened_at', '>=', `${from} 00:00:00`)
    if (to) query.where('opened_at', '<=', `${to} 23:59:59`)

    return query.paginate(page, perPage)
  }

  // POST /work-orders
  async store(ctx) {
    const { request, response, user } = ctx
    const data = await request.validate(CreateWorkOrder)

    // 5x2 comercial não tem turno (horário comercial fixo); 3x3 e 6x1 exigem.
    if (data.escala !== '5x2' && !data.turno) {
      return response.status(422).json({ message: 'Informe o turno.' })
    }

    const pending = await WorkOrder.query()
      .where('requester_user_id', user.id)
      .where('status', 'aguardando_avaliacao')
      .first()
    if (pending) {
      return response.status(422).json({
        message: 'Você já tem uma OS aguardando avaliação. Avalie-a antes de abrir uma nova.',
        code: 'PENDING_EVALUATION',
      })
    }

    const machine = await Machine.find(data.machine_id)
    if (!machine) {
      return response.status(404).json({ message: 'Máquina não encontrada.' })
    }

    let priority = data.priority
    if (priority === 'emergencial' || data.machine_stopped) {
      priority = 'emergencial'
    }

    const requesterSector = user.sector_id ? await Sector.find(user.sector_id) : null

    const workOrder = await WorkOrder.create({
      requester_user_id: user.id,
      requester_name: user.full_name,
      requester_sector_id: user.sector_id,
      requester_sector_name: requesterSector ? requesterSector.name : null,
      requester_turno: data.turno || null,
      requester_escala: data.escala,
      machine_id: machine.id,
      machine_code: machine.code,
      machine_name: machine.name,
      machine_sector: machine.sector,
      priority,
      original_priority: priority,
      description: data.description,
      status: 'aguardando_atendimento',
      opened_at: DateTime.local(),
      occurrence_type: data.occurrence_type || null,
      machine_stopped: !!data.machine_stopped,
      maintenance_type: data.maintenance_type || 'corretiva',
    })

    await AuditLogger.log(ctx, {
      action: 'WO_CREATE',
      entityType: 'work_orders',
      entityId: workOrder.id,
    })

    return response.status(201).json(workOrder)
  }

  // GET /work-orders/:id
  async show({ params, response }) {
    const workOrder = await WorkOrder.query()
      .where('id', params.id)
      .preload('machine')
      .preload('technician')
      .preload('materials', (q) => q.preload('material').preload('technician'))
      .preload('comments')
      .preload('events')
      .preload('participants')
      .preload('pauses', (q) => q.preload('technician'))
      .first()

    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })
    return workOrder
  }

  // PATCH /work-orders/:id/evaluate
  async evaluate(ctx) {
    const { params, request, response, user } = ctx
    const { approved, comment, reason } = await request.validate(EvaluateWorkOrder)

    const workOrder = await WorkOrder.find(params.id)
    if (!workOrder) return response.status(404).json({ message: 'OS não encontrada.' })

    if (workOrder.requester_user_id !== user.id) {
      return response.status(403).json({ message: 'Só quem abriu a OS pode avaliá-la.' })
    }
    if (workOrder.status !== 'aguardando_avaliacao') {
      return response.status(422).json({ message: 'OS não está aguardando avaliação.' })
    }

    if (approved) {
      workOrder.status = 'encerrada'
      workOrder.evaluated_at = DateTime.local()
      workOrder.evaluation_result = true
      workOrder.evaluation_comment = comment || null
      await workOrder.save()

      await AuditLogger.log(ctx, { action: 'WO_APPROVE', entityType: 'work_orders', entityId: workOrder.id })
    } else {
      if (!reason) {
        return response.status(422).json({ message: 'Informe o motivo da reprovação.' })
      }
      workOrder.status = 'reaberta'
      workOrder.evaluated_at = DateTime.local()
      workOrder.evaluation_result = false
      workOrder.reopen_reason = reason
      workOrder.reopened_at = DateTime.local()
      workOrder.reopen_count = (workOrder.reopen_count || 0) + 1
      workOrder.technician_id = null
      workOrder.accepted_at = null
      workOrder.started_at = null
      workOrder.finished_at = null
      await workOrder.save()

      await AuditLogger.log(ctx, { action: 'WO_REJECT', entityType: 'work_orders', entityId: workOrder.id })
    }

    return workOrder
  }
}

module.exports = WorkOrdersController
