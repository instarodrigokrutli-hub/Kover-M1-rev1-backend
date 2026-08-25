'use strict'

const { schema } = use('Adonis/Core/Validator')

class UpdateMyTurno {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    turno: schema.enum(['manha', 'tarde', 'noite']),
  })

  messages = {
    'turno.required': 'Selecione o turno.',
  }
}

module.exports = UpdateMyTurno
