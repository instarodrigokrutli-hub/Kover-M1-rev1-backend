'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/UnitRules.js
|--------------------------------------------------------------------------
|
| Réplica de src/lib/units.ts (frontend) — quais unidades aceitam
| quantidade decimal, usado pelos módulos de Compras (pendências,
| recebimentos) que validam quantidade x unidade antes de gravar.
|
*/

const UNIT_LABEL = {
  UN: 'UN', PC: 'PC', CJ: 'CJ', PAR: 'PAR',
  MM: 'MM', CM: 'CM', M: 'M', M2: 'M²', M3: 'M³', POL: 'POL',
  KG: 'KG', G: 'G', L: 'L', ML: 'ML',
  CX: 'CX', RL: 'RL', SC: 'SC', BD: 'BD', LT: 'LT', PCT: 'PCT',
}

const DECIMAL_UNITS = new Set(['MM', 'CM', 'M', 'M2', 'M3', 'KG', 'G', 'L', 'ML'])

function unitAllowsDecimal(unit) {
  return DECIMAL_UNITS.has(unit)
}

function validateQuantity(qty, unit) {
  const n = Number(qty)
  if (!Number.isFinite(n)) return 'Quantidade inválida'
  if (n <= 0) return 'Quantidade deve ser maior que zero'
  if (!unitAllowsDecimal(unit) && !Number.isInteger(n)) {
    return `A unidade ${UNIT_LABEL[unit] ?? unit} não permite valores decimais`
  }
  return null
}

module.exports = { unitAllowsDecimal, validateQuantity, UNIT_LABEL }
