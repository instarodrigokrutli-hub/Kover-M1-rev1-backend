'use strict'

const { schema } = use('Adonis/Core/Validator')

class LoginUser {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    identifier: schema.string({ trim: true }),
    password: schema.string({}),
  })

  messages = {
    'identifier.required': 'Informe o e-mail ou usuário.',
    'password.required': 'Informe a senha.',
  }
}

module.exports = LoginUser
