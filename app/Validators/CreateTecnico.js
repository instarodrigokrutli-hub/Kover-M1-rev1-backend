'use strict'

const { schema, rules } = use('Adonis/Core/Validator')

/*
|--------------------------------------------------------------------------
| app/Validators/CreateTecnico.js
|--------------------------------------------------------------------------
|
| Um Validator valida o corpo (body) da requisição ANTES dela chegar
| no controller. Se `schema` falhar, o Adonis já responde com 422 e
| a lista de erros sozinho — o controller nem chega a rodar.
|
| Pra ligar um validator numa rota, é só usar no controller:
|   await request.validate(CreateTecnico)   // veja TecnicosController.js
|
*/
class CreateTecnico {
  constructor(ctx) {
    this.ctx = ctx
  }

  schema = schema.create({
    nome: schema.string({ trim: true }, [rules.maxLength(120)]),
    email: schema.string({ trim: true }, [
      rules.email(),
      rules.unique({ table: 'tecnicos', column: 'email' }),
    ]),
    telefone: schema.string.optional({ trim: true }, [rules.maxLength(20)]),
    matricula: schema.string.optional({ trim: true }, [
      rules.maxLength(40),
      rules.unique({ table: 'tecnicos', column: 'matricula' }),
    ]),
    ativo: schema.boolean.optional(),
  })

  messages = {
    'nome.required': 'Informe o nome do técnico.',
    'email.required': 'Informe o e-mail do técnico.',
    'email.email': 'E-mail inválido.',
    'email.unique': 'Já existe um técnico com esse e-mail.',
    'matricula.unique': 'Já existe um técnico com essa matrícula.',
  }
}

module.exports = CreateTecnico
