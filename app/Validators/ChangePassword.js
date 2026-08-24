'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class ChangePassword {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    current_password: schema.string({}),
    new_password: schema.string({}, [rules.minLength(6)]),
  })

  messages = {
    'current_password.required': 'Informe a senha atual.',
    'new_password.required': 'Informe a nova senha.',
    'new_password.minLength': 'A nova senha deve ter ao menos 6 caracteres.',
  }
}

module.exports = ChangePassword
