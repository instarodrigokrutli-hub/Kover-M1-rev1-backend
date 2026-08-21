'use strict'

const { DateTime } = require('luxon')

/*
|--------------------------------------------------------------------------
| app/Models/dateTimeColumn.js
|--------------------------------------------------------------------------
|
| O Lucid normalmente converte Luxon DateTime <-> string de data via os
| decorators @column.dateTime() (que exigem TypeScript). Em JavaScript
| puro, esse mesmo comportamento de "prepare/consume" precisa ser
| declarado manualmente ao chamar $addColumn (ver app/Models/Tecnico.js).
|
*/
function dateTimeColumn({ autoCreate = false, autoUpdate = false } = {}) {
  return {
    prepare: (value) => {
      if (!value || typeof value === 'string') return value
      return value.toSQL({ includeOffset: false })
    },
    consume: (value) => (value ? DateTime.fromSQL(value) : value),
    serialize: (value) => (DateTime.isDateTime(value) ? value.toISO() : value),
    meta: { type: 'datetime', autoCreate, autoUpdate },
  }
}

module.exports = dateTimeColumn
