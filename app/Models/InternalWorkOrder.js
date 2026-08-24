'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class InternalWorkOrder extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('code', {})
    this.$addColumn('origin', {})
    this.$addColumn('machine_id', {})
    this.$addColumn('sector', {})
    this.$addColumn('technician_id', {})
    this.$addColumn('opened_at', dateTimeColumn())
    this.$addColumn('service_type', {})
    this.$addColumn('description', {})
    this.$addColumn('technician_comment', {})
    this.$addColumn('started_at', dateTimeColumn())
    this.$addColumn('finished_at', dateTimeColumn())
    this.$addColumn('status', {})
    this.$addColumn('accepted_at', dateTimeColumn())
    this.$addColumn('paused_at', dateTimeColumn())
    this.$addColumn('total_paused_seconds', {})
    this.$addColumn('created_at', dateTimeColumn({ autoCreate: true, autoUpdate: true }))
    this.$addColumn('updated_at', dateTimeColumn({ autoUpdate: true }))

    this.$addRelation('machine', 'belongsTo', () => require('./Machine'), {
      localKey: 'id',
      foreignKey: 'machine_id',
    })
    this.$addRelation('technician', 'belongsTo', () => require('./Technician'), {
      localKey: 'id',
      foreignKey: 'technician_id',
    })
    this.$addRelation('materials', 'hasMany', () => require('./InternalWoMaterial'), {
      localKey: 'id',
      foreignKey: 'internal_wo_id',
    })
    this.$addRelation('pauses', 'hasMany', () => require('./InternalWoPause'), {
      localKey: 'id',
      foreignKey: 'internal_wo_id',
    })

    // Código da OS interna (OSI-000123) — mesma lógica do WorkOrder.number.
    this.after('create', async (iwo) => {
      if (!iwo.code) {
        iwo.code = `OSI-${String(iwo.id).padStart(6, '0')}`
        await iwo.save()
      }
    })
  }
}

InternalWorkOrder.boot()

module.exports = InternalWorkOrder
