'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/IndicatorsController.js
|--------------------------------------------------------------------------
|
| Indicadores gerenciais de consumo (Fase 2 — migrado do Supabase). Réplica
| fiel da lógica de agregação que antes rodava em
| src/lib/indicators.functions.ts no frontend: os dados vêm agora do Adonis
| (StockMovement/Material/Category/Technician), mas o algoritmo de
| agregação/projeção/spikes é o mesmo, só trocando supabase.from(...) por
| queries Lucid.
|
*/

const { DateTime } = require('luxon')
const Material = require('../../Models/Material')
const StockMovement = require('../../Models/StockMovement')
const Category = require('../../Models/Category')
const Technician = require('../../Models/Technician')
const PendingMaterial = require('../../Models/PendingMaterial')
const { assertRole } = require('../../Services/Authorization')

const ENTRY_TYPES = ['ajuste_entrada', 'inventario_inicial', 'recebimento']
const EXIT_TYPES = ['retirada', 'ajuste_saida']

// created_at é armazenado pelo Lucid como string SQL "naive" (fuso local do
// servidor, sem offset) e lido de volta como um luxon.DateTime — não dá pra
// comparar/filtrar com .toISOString() (formato "T...Z") direto contra a
// coluna. Estas duas funções fazem a ponte nos dois sentidos.
function toSqlBoundary(jsDate) {
  return DateTime.fromJSDate(jsDate).toSQL({ includeOffset: false })
}
function fromModelDate(v) {
  if (!v) return null
  return DateTime.isDateTime(v) ? v.toJSDate() : new Date(v)
}

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${names[m - 1]}/${String(y).slice(2)}`
}
function startOfMonthUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}
function addMonths(d, n) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
}

function resolveRange(input) {
  const now = new Date()
  const to = input.to ? new Date(input.to) : now
  let from
  if (input.from) from = new Date(input.from)
  else {
    const months = input.months ?? 6
    from = addMonths(startOfMonthUTC(to), -(months - 1))
  }
  return { from, to }
}

class IndicatorsController {
  // POST /indicators
  async index(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const { request } = ctx
    const body = request.post() || {}
    const filters = {
      from: body.from || null,
      to: body.to || null,
      months: body.months ? Number(body.months) : undefined,
      category_id: body.category_id || null,
      technician_id: body.technician_id || null,
      material_id: body.material_id || null,
    }

    const { from, to } = resolveRange(filters)

    let mq = StockMovement.query()
      .preload('material', (q) => q.preload('category'))
      .preload('technician')
      .where('created_at', '>=', toSqlBoundary(from))
      .where('created_at', '<=', toSqlBoundary(to))
      .orderBy('created_at', 'asc')
    if (filters.material_id) mq = mq.where('material_id', filters.material_id)
    if (filters.technician_id) mq = mq.where('technician_id', filters.technician_id)
    const movs = await mq

    const rows = movs.filter((m) => !filters.category_id || m.material?.category_id == filters.category_id)

    const monthlyMap = new Map()
    {
      let cur = startOfMonthUTC(from)
      const last = startOfMonthUTC(to)
      while (cur <= last) {
        monthlyMap.set(monthKey(cur), {
          value: 0, qty: 0, withdrawals: 0,
          entries_value: 0, exits_value: 0, entries_qty: 0, exits_qty: 0,
        })
        cur = addMonths(cur, 1)
      }
    }

    const matAgg = new Map()
    const catAgg = new Map()
    const techAgg = new Map()

    let last_movement_at = null
    let last_movement_desc = null

    for (const m of rows) {
      const d = fromModelDate(m.created_at)
      const k = monthKey(d)
      const bucket = monthlyMap.get(k)
      if (!bucket) continue
      const v = Number(m.total_value) || 0
      const q = Number(m.quantity) || 0
      const isEntry = ENTRY_TYPES.includes(m.type)
      const isExit = EXIT_TYPES.includes(m.type)

      if (isEntry) { bucket.entries_value += v; bucket.entries_qty += q }
      if (isExit) { bucket.exits_value += v; bucket.exits_qty += q }

      if (m.type === 'retirada') {
        bucket.value += v; bucket.qty += q; bucket.withdrawals += 1
        const mat = m.material
        if (mat) {
          const e = matAgg.get(mat.id) ?? { id: mat.id, code: mat.code, name: mat.name, qty: 0, value: 0, count: 0 }
          e.qty += q; e.value += v; e.count += 1; matAgg.set(mat.id, e)
          if (mat.category) {
            const ce = catAgg.get(mat.category.id) ?? { id: mat.category.id, name: mat.category.name, qty: 0, value: 0, count: 0 }
            ce.qty += q; ce.value += v; ce.count += 1; catAgg.set(mat.category.id, ce)
          }
        }
        if (m.technician) {
          const te = techAgg.get(m.technician.id) ?? { id: m.technician.id, name: m.technician.name, qty: 0, value: 0, count: 0 }
          te.qty += q; te.value += v; te.count += 1; techAgg.set(m.technician.id, te)
        }
      }

      const createdAtStr = d.toISOString()
      if (!last_movement_at || createdAtStr > last_movement_at) {
        last_movement_at = createdAtStr
        const label = m.type === 'retirada' ? 'Retirada' : m.type === 'ajuste_entrada' ? 'Entrada' : m.type === 'ajuste_saida' ? 'Saída' : m.type === 'recebimento' ? 'Recebimento' : 'Inv. inicial'
        last_movement_desc = `${label} • ${m.material?.code ?? ''} ${m.material?.name ?? ''}`.trim()
      }
    }

    const monthlyKeys = Array.from(monthlyMap.keys()).sort()

    const allMats = await Material.query()
    const activeMats = allMats.filter((m) => m.status === 'ativo')
    const stock_value = activeMats.reduce((s, m) => s + Number(m.quantity) * Number(m.unit_value), 0)
    const items_in_stock = activeMats.reduce((s, m) => s + Number(m.quantity), 0)

    const netByMonth = new Map()
    const allMovsSince = await StockMovement.query()
      .where('created_at', '>=', toSqlBoundary(from))
      .select('type', 'total_value', 'created_at')
    for (const m of allMovsSince) {
      const k = monthKey(fromModelDate(m.created_at))
      const v = Number(m.total_value) || 0
      const isEntry = ENTRY_TYPES.includes(m.type)
      const isExit = EXIT_TYPES.includes(m.type)
      const delta = isEntry ? v : isExit ? -v : 0
      netByMonth.set(k, (netByMonth.get(k) ?? 0) + delta)
    }
    const allKeys = monthlyKeys.slice()
    const stockEnd = new Map()
    let running = stock_value
    const currentKey = monthKey(startOfMonthUTC(new Date()))
    const monthsAfter = []
    {
      let cur = addMonths(startOfMonthUTC(to), 1)
      const nowKey = currentKey
      while (monthKey(cur) <= nowKey) { monthsAfter.push(monthKey(cur)); cur = addMonths(cur, 1) }
    }
    for (const k of monthsAfter) running -= (netByMonth.get(k) ?? 0)
    for (let i = allKeys.length - 1; i >= 0; i--) {
      stockEnd.set(allKeys[i], running)
      running -= (netByMonth.get(allKeys[i]) ?? 0)
    }

    const monthly = monthlyKeys.map((k) => ({
      month: k, label: monthLabel(k),
      ...monthlyMap.get(k),
      stock_value_end: Math.max(0, stockEnd.get(k) ?? 0),
    }))

    const curKey = monthKey(startOfMonthUTC(to))
    const prevKey = monthKey(addMonths(startOfMonthUTC(to), -1))
    const cur = monthlyMap.get(curKey) ?? { value: 0, qty: 0, withdrawals: 0, entries_value: 0, exits_value: 0, entries_qty: 0, exits_qty: 0 }
    let prev = monthlyMap.get(prevKey)
    if (!prev) {
      const pStart = addMonths(startOfMonthUTC(to), -1)
      const pEnd = startOfMonthUTC(to)
      let pq = StockMovement.query()
        .preload('material')
        .where('type', 'retirada')
        .where('created_at', '>=', toSqlBoundary(pStart))
        .where('created_at', '<', toSqlBoundary(pEnd))
      if (filters.material_id) pq = pq.where('material_id', filters.material_id)
      if (filters.technician_id) pq = pq.where('technician_id', filters.technician_id)
      const pr = await pq
      const filtered = pr.filter((m) => !filters.category_id || m.material?.category_id == filters.category_id)
      prev = {
        value: filtered.reduce((s, m) => s + Number(m.total_value || 0), 0),
        qty: filtered.reduce((s, m) => s + Number(m.quantity || 0), 0),
        withdrawals: filtered.length,
        entries_value: 0, exits_value: 0, entries_qty: 0, exits_qty: 0,
      }
    }

    const monthStart = startOfMonthUTC(to)
    const monthEnd = addMonths(monthStart, 1)
    const entriesRows = await StockMovement.query()
      .whereIn('type', ENTRY_TYPES)
      .where('created_at', '>=', toSqlBoundary(monthStart))
      .where('created_at', '<', toSqlBoundary(monthEnd))
      .select('id')
    const entriesCount = entriesRows.length

    const yoyStart = new Date(Date.UTC(monthStart.getUTCFullYear() - 1, monthStart.getUTCMonth(), 1))
    const yoyEnd = addMonths(yoyStart, 1)
    const yoyRows = await StockMovement.query()
      .where('type', 'retirada')
      .where('created_at', '>=', toSqlBoundary(yoyStart))
      .where('created_at', '<', toSqlBoundary(yoyEnd))
      .select('total_value')
    const yoy_month_value = yoyRows.reduce((s, m) => s + Number(m.total_value || 0), 0)
    const yoy_delta_pct = yoy_month_value > 0 ? ((cur.value - yoy_month_value) / yoy_month_value) * 100 : null

    const yearStart = new Date(Date.UTC(to.getUTCFullYear(), 0, 1))
    let yq = StockMovement.query()
      .preload('material')
      .where('type', 'retirada')
      .where('created_at', '>=', toSqlBoundary(yearStart))
    if (filters.material_id) yq = yq.where('material_id', filters.material_id)
    if (filters.technician_id) yq = yq.where('technician_id', filters.technician_id)
    const yearRows = await yq
    const yearFiltered = yearRows.filter((m) => !filters.category_id || m.material?.category_id == filters.category_id)
    const accumulated_year_value = yearFiltered.reduce((s, m) => s + Number(m.total_value || 0), 0)

    const delta_value_pct = prev.value > 0 ? ((cur.value - prev.value) / prev.value) * 100 : null
    const avg_per_withdrawal = cur.withdrawals > 0 ? cur.value / cur.withdrawals : 0

    const pendingRows = await PendingMaterial.query().where('status', 'pendente').select('id')
    const pendingCount = pendingRows.length

    const lowStockList = activeMats
      .filter((m) => Number(m.min_quantity) > 0 && Number(m.quantity) <= Number(m.min_quantity))
      .map((m) => ({ id: m.id, code: m.code, name: m.name, quantity: Number(m.quantity), min_quantity: Number(m.min_quantity) }))

    const totalConsumption = Array.from(catAgg.values()).reduce((s, c) => s + c.value, 0)
    const categoryConsumption = Array.from(catAgg.values())
      .map((c) => ({ id: c.id, name: c.name, value: c.value, pct: totalConsumption > 0 ? (c.value / totalConsumption) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)

    const lowTurnover = Array.from(matAgg.values())
      .filter((m) => m.count <= 2)
      .sort((a, b) => a.count - b.count).slice(0, 10)
      .map((m) => ({ id: m.id, code: m.code, name: m.name, qty: m.qty, count: m.count }))

    const moved = new Set(Array.from(matAgg.keys()))
    const noMovementCandidates = activeMats.filter((m) => !moved.has(m.id))
    const idsToCheck = noMovementCandidates.slice(0, 200).map((m) => m.id)
    const lastMap = new Map()
    if (idsToCheck.length > 0) {
      const lastRows = await StockMovement.query()
        .whereIn('material_id', idsToCheck)
        .orderBy('created_at', 'desc')
        .limit(2000)
        .select('material_id', 'created_at')
      for (const r of lastRows) {
        if (!lastMap.has(r.material_id)) {
          lastMap.set(r.material_id, fromModelDate(r.created_at).toISOString())
        }
      }
    }
    const noMovement = noMovementCandidates.slice(0, 50).map((m) => ({
      id: m.id, code: m.code, name: m.name, quantity: Number(m.quantity),
      last_movement_at: lastMap.get(m.id) ?? null,
    })).sort((a, b) => (a.last_movement_at ?? '').localeCompare(b.last_movement_at ?? ''))

    const monthsWithData = monthly.filter((m) => m.value > 0).length
    let projection
    if (monthsWithData < 6) {
      projection = {
        enabled: false, months_available: monthsWithData,
        avg_monthly_value: 0, trend_pct: 0, forecast_next_value: 0,
        message: 'Ainda não há dados suficientes (mínimo de 6 meses) para gerar projeções confiáveis.',
      }
    } else {
      const series = monthly.map((m, i) => ({ x: i, y: m.value }))
      const n = series.length
      const sumX = series.reduce((s, p) => s + p.x, 0)
      const sumY = series.reduce((s, p) => s + p.y, 0)
      const sumXY = series.reduce((s, p) => s + p.x * p.y, 0)
      const sumX2 = series.reduce((s, p) => s + p.x * p.x, 0)
      const meanY = sumY / n
      const denom = n * sumX2 - sumX * sumX
      const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
      const intercept = (sumY - slope * sumX) / n
      const forecast = slope * n + intercept
      const trend_pct = meanY > 0 ? (slope / meanY) * 100 : 0
      projection = {
        enabled: true, months_available: monthsWithData,
        avg_monthly_value: meanY, trend_pct, forecast_next_value: Math.max(0, forecast),
      }
    }

    const months3Start = addMonths(startOfMonthUTC(to), -3)
    const hist = await StockMovement.query()
      .preload('material', (q) => q.preload('category'))
      .where('type', 'retirada')
      .where('created_at', '>=', toSqlBoundary(months3Start))
      .where('created_at', '<', toSqlBoundary(monthEnd))

    const catBy = new Map()
    const matBy = new Map()
    for (const m of hist) {
      const d = fromModelDate(m.created_at)
      const isCurrent = d >= monthStart && d < monthEnd
      const monthsBack = (monthStart.getUTCFullYear() - d.getUTCFullYear()) * 12 + (monthStart.getUTCMonth() - d.getUTCMonth())
      const v = Number(m.total_value || 0)
      const mat = m.material
      if (mat) {
        const ke = matBy.get(mat.id) ?? { code: mat.code, name: mat.name, cur: 0, sums: [0, 0, 0] }
        if (isCurrent) ke.cur += v
        else if (monthsBack >= 1 && monthsBack <= 3) ke.sums[monthsBack - 1] += v
        matBy.set(mat.id, ke)
        if (mat.category) {
          const ce = catBy.get(mat.category.id) ?? { name: mat.category.name, cur: 0, sums: [0, 0, 0] }
          if (isCurrent) ce.cur += v
          else if (monthsBack >= 1 && monthsBack <= 3) ce.sums[monthsBack - 1] += v
          catBy.set(mat.category.id, ce)
        }
      }
    }
    function buildSpikes(map) {
      const out = []
      for (const [id, v] of map.entries()) {
        const valid = v.sums.filter((x) => x > 0)
        if (valid.length === 0 || v.cur <= 0) continue
        const avg3 = valid.reduce((s, x) => s + x, 0) / valid.length
        if (avg3 <= 0) continue
        const pct = ((v.cur - avg3) / avg3) * 100
        if (pct > 30) out.push({ id, avg3, current: v.cur, pct, extra: v })
      }
      return out.sort((a, b) => b.pct - a.pct).slice(0, 10)
    }
    const catSpikes = buildSpikes(catBy).map((s) => ({
      category_id: s.id, name: s.extra.name, current: s.current, avg3: s.avg3, pct: s.pct,
    }))
    const matSpikes = buildSpikes(matBy).map((s) => ({
      material_id: s.id, code: s.extra.code, name: s.extra.name,
      current: s.current, avg3: s.avg3, pct: s.pct,
    }))

    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const stale = noMovement.filter((m) => !m.last_movement_at || m.last_movement_at < cutoff)
      .slice(0, 20).map((m) => ({ id: m.id, code: m.code, name: m.name, last_movement_at: m.last_movement_at }))

    const topN = (map) => Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 10)

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      kpis: {
        stock_value,
        month_value: cur.value,
        year_value: accumulated_year_value,
        materials_count: allMats.length,
        items_in_stock,
        month_withdrawals: cur.withdrawals,
        month_entries_count: entriesCount ?? 0,
        low_stock_count: lowStockList.length,
        pending_count: pendingCount,
        last_movement_at, last_movement_desc,
        month_qty: cur.qty,
        prev_month_value: prev.value,
        prev_month_qty: prev.qty,
        prev_month_withdrawals: prev.withdrawals,
        delta_value_pct,
        yoy_month_value,
        yoy_delta_pct,
        avg_per_withdrawal,
        accumulated_year_value,
      },
      monthly,
      topMaterials: topN(matAgg),
      topCategories: topN(catAgg),
      topTechnicians: topN(techAgg),
      categoryConsumption,
      lowTurnover,
      noMovement,
      projection,
      alerts: { categorySpikes: catSpikes, materialSpikes: matSpikes, lowStock: lowStockList, stale },
    }
  }

  // GET /indicators/filter-options
  async filterOptions(ctx) {
    assertRole(ctx, ['admin', 'coordenador'])
    const [categories, technicians, materials] = await Promise.all([
      Category.query().orderBy('name', 'asc').select('id', 'name'),
      Technician.query().where('status', 'ativo').orderBy('name', 'asc').select('id', 'name'),
      Material.query().where('status', 'ativo').orderBy('name', 'asc').select('id', 'code', 'name'),
    ])
    return { categories, technicians, materials }
  }
}

module.exports = IndicatorsController
