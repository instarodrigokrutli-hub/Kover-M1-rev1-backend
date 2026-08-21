'use strict'

/*
|--------------------------------------------------------------------------
| app/Validators/CreateTecnico.js
|--------------------------------------------------------------------------
|
| Um Validator valida o corpo (body) da requisição ANTES dela chegar
| no controller. Se `rules()` falhar, o Adonis já responde com 422 e
| a lista de erros sozinho — o controller nem chega a rodar.
|
| Pra ligar um validator numa rota, é só usar no controller:
|   await request.validate({ rules: ... })   // veja TecnicosController.js
|
*/
class CreateTecnico {
  get rules() {
    return {
      nome: 'required|string|max:120',
      email: 'required|email|unique:tecnicos,email',
      telefone: 'string|max:20',
      matricula: 'string|max:40|unique:tecnicos,matricula',
    }
  }

  get messages() {
    return {
      'nome.required': 'Informe o nome do técnico.',
      'email.required': 'Informe o e-mail do técnico.',
      'email.email': 'E-mail inválido.',
      'email.unique': 'Já existe um técnico com esse e-mail.',
      'matricula.unique': 'Já existe um técnico com essa matrícula.',
    }
  }
}

module.exports = CreateTecnico
