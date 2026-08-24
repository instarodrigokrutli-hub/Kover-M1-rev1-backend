'use strict'

const { BaseModel } = use('Adonis/Lucid/Orm')
const dateTimeColumn = require('./dateTimeColumn')

class WorkOrder extends BaseModel {
  static boot() {
    super.boot()
    this.$addColumn('id', { isPrimary: true })
    this.$addColumn('number', {})
    this.$addColumn('requester_user_id', {})
    this.$addColumn('requester_name', {})
    this.$addColumn('requester_sector_id', {})
    this.$addColumn('requester_sector_name', {})
    this.$addColumn('requester_turno', {})
    this.$addColumn('machine_id', {})
    this.$addColumn('machine_code', {})
    this.$addColumn('machine_name', {})
    this.$addColumn('machine_sector', {})
    this.$addColumn('priority', {})
    this.$addColumn('description', {})
    this.$addColumn('status', {})
    this.$addColumn('opened_at', dateTimeColumn())
    this.$addColumn('technician_id', {})
    this.$addColumn('accepted_at', dateTimeColumn())
    this.$addColumn('started_at', dateTimeColumn())
    this.$addColumn('finished_at', dateTimeColumn())
    this.$addColumn('service_type', {})
    this.$addColumn('technician_comment', {})
    this.$addColumn('final_comment', {})
    this.$addColumn('evaluated_at', dateTimeColumn())
    this.$addColumn('evaluation_result', {})
    this.$addColumn('evaluation_comment', {})
    this.$addColumn('reopen_reason', {})
    this.$addColumn('reopened_at', dateTimeColumn())
    this.$addColumn('reopen_count', {})
    this.$addColumn('occurrence_type', {})
    this.$addColumn('machine_stopped', {})
    this.$addColumn('paused_at', dateTimeColumn())
    this.$addColumn('total_paused_seconds', {})
    this.$addColumn('maintenance_type', {})
    this.$addColumn('due_at', dateTimeColumn())
    this.$addColumn('estimated_minutes', {})
    this.$addColumn('validated_at', dateTimeColumn())
    this.$addColumn('validated_by', {})
    this.$addColumn('validation_comment', {})
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
    this.$addRelation('materials', 'hasMany', () => require('./WorkOrderMaterial'), {
      localKey: 'id',
      foreignKey: 'work_order_id',
    })
    this.$addRelation('comments', 'hasMany', () => require('./WorkOrderComment'), {
      localKey: 'id',
      foreignKey: 'work_order_id',
    })
    this.$addRelation('events', 'hasMany', () => require('./WorkOrderEvent'), {
      localKey: 'id',
      foreignKey: 'work_order_id',
    })
    this.$addRelation('participants', 'hasMany', () => require('./WorkOrderParticipant'), {
      localKey: 'id',
      foreignKey: 'work_order_id',
    })
    this.$addRelation('pauses', 'hasMany', () => require('./WorkOrderPause'), {
      localKey: 'id',
      foreignKey: 'work_order_id',
    })

    // Número da OS (OS-000123) é gerado após o insert, quando o id
    // autoincrement já existe — reproduz o `tg_wo_set_number` do schema
    // original (lá era trigger+sequence do Postgres).
    this.after('create', async (workOrder) => {
      if (!workOrder.number) {
        workOrder.number = `OS-${String(workOrder.id).padStart(6, '0')}`
        await workOrder.save()
      }
    })
  }
}

WorkOrder.boot()

module.exports = WorkOrder
