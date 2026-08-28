'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class SavePlanItem {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    id: schema.number.optional([rules.exists({ table: 'maintenance_plan_items', column: 'id' })]),
    plan_id: schema.number([rules.exists({ table: 'maintenance_plans', column: 'id' })]),
    description: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(200)]),
    notes: schema.string.optional({ trim: true }, [rules.maxLength(500)]),
    required: schema.boolean.optional(),
  })

  messages = {}
}

module.exports = SavePlanItem
