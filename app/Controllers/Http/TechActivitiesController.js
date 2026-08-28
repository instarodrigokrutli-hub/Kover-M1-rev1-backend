'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/TechActivitiesController.js
|--------------------------------------------------------------------------
|
| Registro de atividades do técnico (Fase 2, migrado do Supabase). Réplica
| fiel de src/lib/activities.functions.ts — inclusive o ensureMachine, que
| antes duplicava a tabela machines no Supabase; aqui ele já opera sobre a
| mesma tabela machines que o resto do sistema usa.
|
*/

const { DateTime } = require('luxon')
const Machine = require('../../Models/Machine')
const TechActivity = require('../../Models/TechActivity')
const AuditLogger = require('../../Services/AuditLogger')
const { assertRole } = require('../../Services/Authorization')
const CreateTechActivity = require('../../Validators/CreateTechActivity')
const CreateTechActivityRoute = require('../../Validators/CreateTechActivityRoute')

function parseParts(startAt, endAt) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    activity_date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    start_time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    end_time: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
  }
}

async function ensureMachine(machineId, machineName, sector) {
  if (machineId) return machineId
  const nm = (machineName ?? '').trim()
  if (!nm) return null
  const existing = await Machine.query().whereRaw('lower(name) = ?', [nm.toLowerCase()]).first()
  if (existing) return existing.id
  const created = await Machine.create({ name: nm, sector, status: 'ativo' })
  return created.id
}

class TechActivitiesController {
  // POST /tech-activities
  async store(ctx) {
    const { request, response, technician } = ctx
    const data = await request.validate(CreateTechActivity)

    const start = new Date(data.start_at)
    const end = new Date(data.end_at)
    if (!(end.getTime() > start.getTime())) {
      return response.status(422).json({ message: 'Término deve ser após o início.' })
    }
    if (end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
      return response.status(422).json({ message: 'Atividade não pode durar mais de 24h.' })
    }

    const machineId = await ensureMachine(data.machine_id ?? null, data.machine_name ?? null, data.sector)
    const { activity_date, start_time, end_time } = parseParts(data.start_at, data.end_at)

    const row = await TechActivity.create({
      technician_id: technician.id,
      activity_date,
      start_time,
      end_time,
      machine_id: machineId,
      sector: data.sector,
      activity_type: data.activity_type,
      description: data.description,
      notes: data.notes || null,
    })

    await AuditLogger.log(ctx, {
      action: 'ACTIVITY_CREATE',
      entityType: 'tech_activity',
      entityId: row.id,
      details: { activity_type: data.activity_type, sector: data.sector },
    })

    return response.status(201).json({ ok: true, id: row.id })
  }

  // POST /tech-activities/route
  async storeRoute(ctx) {
    const { request, response, technician } = ctx
    const data = await request.validate(CreateTechActivityRoute)
    const n = data.items.length

    const ids = []
    for (const item of data.items) {
      const start = new Date(item.start_at)
      const end = new Date(item.end_at)
      if (!(end.getTime() > start.getTime()) || end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
        return response.status(422).json({ message: `Horário inválido para ${item.machine_name}.` })
      }

      const machineId = await ensureMachine(null, item.machine_name, data.sector)
      const { activity_date, start_time, end_time } = parseParts(item.start_at, item.end_at)

      const row = await TechActivity.create({
        technician_id: technician.id,
        activity_date,
        start_time,
        end_time,
        machine_id: machineId,
        sector: data.sector,
        activity_type: data.activity_type,
        description: data.description,
        notes: data.notes ? `${data.notes} (rota: ${n} máquinas)` : `Rota de ${n} máquinas`,
      })
      ids.push(row.id)

      await AuditLogger.log(ctx, {
        action: 'ACTIVITY_CREATE',
        entityType: 'tech_activity',
        entityId: row.id,
        details: { activity_type: data.activity_type, sector: data.sector, route: true, machine: item.machine_name },
      })
    }

    return response.status(201).json({ ok: true, ids, count: n })
  }

  // GET /tech-activities/mine
  async mine({ technician }) {
    const rows = await TechActivity.query()
      .where('technician_id', technician.id)
      .preload('machine')
      .orderBy('created_at', 'desc')
      .limit(50)

    return rows.map((r) => ({
      id: r.id,
      activity_date: r.activity_date,
      start_time: r.start_time,
      end_time: r.end_time,
      sector: r.sector,
      activity_type: r.activity_type,
      description: r.description,
      notes: r.notes,
      created_at: DateTime.isDateTime(r.created_at) ? r.created_at.toISO() : r.created_at,
      machine_name: r.machine?.name ?? null,
    }))
  }

  // GET /tech-activities — visão PCM/Coordenador
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const { technician_id, machine_id, sector, activity_type, from, to } = request.qs()
    const query = TechActivity.query()
      .preload('technician')
      .preload('machine')
      .orderBy('activity_date', 'desc')
      .orderBy('start_time', 'desc')
      .limit(500)
    if (technician_id) query.where('technician_id', technician_id)
    if (machine_id) query.where('machine_id', machine_id)
    if (sector) query.whereRaw('lower(sector) like ?', [`%${String(sector).toLowerCase()}%`])
    if (activity_type) query.where('activity_type', activity_type)
    if (from) query.where('activity_date', '>=', from)
    if (to) query.where('activity_date', '<=', to)

    const rows = await query
    return rows.map((r) => ({
      id: r.id,
      activity_date: r.activity_date,
      start_time: r.start_time,
      end_time: r.end_time,
      sector: r.sector,
      activity_type: r.activity_type,
      description: r.description,
      technician_id: r.technician_id,
      technician_name: r.technician?.name ?? '—',
      machine_id: r.machine_id,
      machine_name: r.machine?.name ?? null,
    }))
  }

  // GET /tech-activities/:id
  async show(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { params, response } = ctx
    const row = await TechActivity.query()
      .where('id', params.id)
      .preload('technician')
      .preload('machine')
      .first()
    if (!row) {
      return response.status(404).json({ message: 'Registro não encontrado.' })
    }
    return {
      id: row.id,
      activity_date: row.activity_date,
      start_time: row.start_time,
      end_time: row.end_time,
      sector: row.sector,
      activity_type: row.activity_type,
      description: row.description,
      notes: row.notes,
      technician_name: row.technician?.name ?? '—',
      machine_name: row.machine?.name ?? null,
    }
  }

  // GET /tech-activities/sectors — setores distintos já usados em atividades.
  async sectors(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const rows = await TechActivity.query().select('sector')
    return Array.from(new Set(rows.map((r) => r.sector).filter(Boolean)))
  }
}

module.exports = TechActivitiesController
