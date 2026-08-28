'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/AssetsController.js
|--------------------------------------------------------------------------
|
| Gestão de Ativos — prontuário de máquinas (Fase 2, migrado do Supabase).
| Somente leitura; réplica fiel de src/lib/assets.functions.ts, trocando as
| queries Supabase pelos models Lucid já existentes (dados que a Fase 1 já
| tornou Adonis-nativos: machines, work_orders, internal_work_orders e
| tabelas filhas).
|
*/

const Machine = require('../../Models/Machine')
const WorkOrder = require('../../Models/WorkOrder')
const InternalWorkOrder = require('../../Models/InternalWorkOrder')
const Technician = require('../../Models/Technician')
const { assertRole } = require('../../Services/Authorization')

const ALLOW_COORDENADOR = false

function assertAssetAccess(ctx) {
  const roles = ALLOW_COORDENADOR ? ['admin', 'coordenador'] : ['admin']
  assertRole(ctx, roles)
}

function minutesBetween(a, b, pausedSeconds = 0) {
  if (!a || !b) return null
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(0, Math.round(ms / 60000) - Math.round(pausedSeconds / 60))
}

function toIso(v) {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

class AssetsController {
  // GET /assets
  async index(ctx) {
    assertAssetAccess(ctx)

    const [machines, wos, iwos] = await Promise.all([
      Machine.query().orderBy('name', 'asc'),
      WorkOrder.query().select('machine_id', 'opened_at', 'finished_at').limit(20000),
      InternalWorkOrder.query().select('machine_id', 'opened_at', 'finished_at').limit(20000),
    ])

    const counts = new Map()
    const last = new Map()
    const track = (rows) => {
      for (const r of rows) {
        if (!r.machine_id) continue
        counts.set(r.machine_id, (counts.get(r.machine_id) ?? 0) + 1)
        const when = toIso(r.finished_at) ?? toIso(r.opened_at)
        if (when && (!last.get(r.machine_id) || when > last.get(r.machine_id))) {
          last.set(r.machine_id, when)
        }
      }
    }
    track(wos)
    track(iwos)

    return machines.map((m) => ({
      id: m.id,
      code: m.code ?? null,
      name: m.name,
      sector: m.sector,
      status: m.status,
      totalOS: counts.get(m.id) ?? 0,
      lastMaintenanceAt: last.get(m.id) ?? null,
    }))
  }

  // GET /assets/:id
  async show(ctx) {
    assertAssetAccess(ctx)
    const { params, response } = ctx

    const machine = await Machine.find(params.id)
    if (!machine) {
      return response.status(404).json({ message: 'Equipamento não encontrado.' })
    }

    const [wos, iwos, techs] = await Promise.all([
      WorkOrder.query().where('machine_id', params.id).orderBy('opened_at', 'desc').limit(2000),
      InternalWorkOrder.query().where('machine_id', params.id).orderBy('opened_at', 'desc').limit(2000),
      Technician.query().limit(2000).select('id', 'name'),
    ])

    const techMap = new Map(techs.map((t) => [t.id, t.name]))

    const orders = [
      ...wos.map((w) => ({
        id: w.id,
        kind: 'corretiva',
        number: w.number,
        opened_at: toIso(w.opened_at),
        finished_at: toIso(w.finished_at),
        service_type: w.service_type,
        priority: w.priority,
        technician_name: w.technician_id ? (techMap.get(w.technician_id) ?? null) : null,
        status: w.status,
        evaluation_result: w.evaluation_result,
        duration_minutes: minutesBetween(w.started_at, w.finished_at, w.total_paused_seconds ?? 0),
        description: w.description,
        technician_comment: w.technician_comment,
        final_comment: w.final_comment,
        evaluation_comment: w.evaluation_comment,
        requester_name: w.requester_name,
      })),
      ...iwos.map((w) => ({
        id: w.id,
        kind: 'corretiva_programada',
        number: w.code,
        opened_at: toIso(w.opened_at),
        finished_at: toIso(w.finished_at),
        service_type: w.service_type,
        priority: null,
        technician_name: w.technician_id ? (techMap.get(w.technician_id) ?? null) : null,
        status: w.status,
        evaluation_result: null,
        duration_minutes: minutesBetween(w.started_at, w.finished_at, w.total_paused_seconds ?? 0),
        description: w.description,
        technician_comment: w.technician_comment,
        final_comment: null,
        evaluation_comment: null,
        requester_name: null,
      })),
    ].sort((a, b) => (a.opened_at < b.opened_at ? 1 : -1))

    const woIds = wos.map((w) => w.id)
    const iwoIds = iwos.map((w) => w.id)
    const orderNumber = new Map(orders.map((o) => [o.id, o.number]))

    const [woMats, iwoMats, events, participants] = await Promise.all([
      woIds.length
        ? require('../../Models/WorkOrderMaterial').query()
            .whereIn('work_order_id', woIds)
            .preload('material')
            .limit(5000)
        : Promise.resolve([]),
      iwoIds.length
        ? require('../../Models/InternalWoMaterial').query()
            .whereIn('internal_wo_id', iwoIds)
            .preload('material')
            .limit(5000)
        : Promise.resolve([]),
      woIds.length
        ? require('../../Models/WorkOrderEvent').query()
            .whereIn('work_order_id', woIds)
            .orderBy('created_at', 'asc')
            .limit(5000)
        : Promise.resolve([]),
      woIds.length
        ? require('../../Models/WorkOrderParticipant').query()
            .whereIn('work_order_id', woIds)
            .limit(5000)
        : Promise.resolve([]),
    ])

    const materials = [
      ...woMats.map((m) => ({
        id: m.id,
        date: toIso(m.created_at),
        material_name: m.material?.name ?? '—',
        material_code: m.material?.code ?? null,
        unit: m.material?.unit ?? null,
        quantity: Number(m.quantity),
        technician_name: m.technician_id ? (techMap.get(m.technician_id) ?? null) : null,
        order_number: orderNumber.get(m.work_order_id) ?? '—',
        order_id: m.work_order_id,
        note: null,
      })),
      ...iwoMats.map((m) => ({
        id: m.id,
        date: toIso(m.created_at),
        material_name: m.material?.name ?? '—',
        material_code: m.material?.code ?? null,
        unit: m.material?.unit ?? null,
        quantity: Number(m.quantity),
        technician_name: null,
        order_number: orderNumber.get(m.internal_wo_id) ?? '—',
        order_id: m.internal_wo_id,
        note: null,
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1))

    const EVENT_LABEL = {
      created: 'OS criada',
      started: 'Atendimento iniciado',
      takeover: 'Atendimento assumido',
      paused: 'Atendimento pausado',
      resumed: 'Atendimento retomado',
      material_added: 'Material retirado do estoque',
      finished: 'OS concluída',
      evaluated: 'Avaliação da Produção',
      reopened: 'OS reaberta',
      comment: 'Comentário do técnico',
    }

    const timeline = []
    for (const o of orders) {
      timeline.push({ at: o.opened_at, order_number: o.number, order_id: o.id, label: 'OS criada', actor: o.requester_name })
    }
    for (const e of events) {
      timeline.push({
        at: toIso(e.created_at),
        order_number: orderNumber.get(e.work_order_id) ?? null,
        order_id: e.work_order_id,
        label: e.message || EVENT_LABEL[e.event_type] || e.event_type,
        actor: e.technician_name ?? null,
      })
    }
    for (const m of materials) {
      timeline.push({
        at: m.date, order_number: m.order_number, order_id: m.order_id,
        label: `Material retirado: ${m.material_name} (${m.quantity})`, actor: m.technician_name,
      })
    }
    for (const o of orders) {
      if (o.finished_at) {
        timeline.push({ at: o.finished_at, order_number: o.number, order_id: o.id, label: 'OS concluída', actor: o.technician_name })
      }
    }
    timeline.sort((a, b) => (a.at < b.at ? 1 : -1))

    const technicians = Array.from(new Set([
      ...participants.map((p) => p.technician_name),
      ...orders.map((o) => o.technician_name),
    ].filter(Boolean)))

    return {
      machine: {
        id: machine.id,
        code: machine.code ?? null,
        name: machine.name,
        sector: machine.sector,
        status: machine.status,
        created_at: toIso(machine.created_at),
        fabricante: machine.fabricante ?? null,
        modelo: machine.modelo ?? null,
        patrimonio: machine.serial_number ?? null,
        acquired_at: machine.acquired_at ?? null,
      },
      orders,
      materials,
      events: timeline.slice(0, 500),
      technicians,
    }
  }
}

module.exports = AssetsController
