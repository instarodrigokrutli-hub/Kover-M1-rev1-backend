'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

class UpdateSupplier {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    razao_social: schema.string({ trim: true }, [rules.minLength(2), rules.maxLength(200)]),
    nome_fantasia: schema.string.optional({ trim: true }, [rules.maxLength(200)]),
    cnpj: schema.string({ trim: true }, [rules.minLength(11), rules.maxLength(20)]),
    cidade: schema.string.optional({ trim: true }, [rules.maxLength(100)]),
    estado: schema.string.optional({ trim: true }, [rules.maxLength(2)]),
    telefone: schema.string.optional({ trim: true }, [rules.maxLength(30)]),
    email: schema.string.optional({ trim: true }, [rules.email(), rules.maxLength(200)]),
    contato: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    observacoes: schema.string.optional({ trim: true }, [rules.maxLength(1000)]),
    status: schema.enum(['ativo', 'inativo']),
  })

  messages = {}
}

module.exports = UpdateSupplier
