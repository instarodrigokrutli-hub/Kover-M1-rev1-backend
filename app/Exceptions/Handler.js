'use strict'

const BaseExceptionHandler = use('Adonis/Core/HttpExceptionHandler')

/*
|--------------------------------------------------------------------------
| app/Exceptions/Handler.js
|--------------------------------------------------------------------------
|
| Handler global de erros. Qualquer exceção não tratada dentro de um
| controller acaba caindo aqui — é o lugar certo pra padronizar o
| formato de erro da API (em vez de cada controller ter seu try/catch).
|
*/
class ExceptionHandler extends BaseExceptionHandler {
  async handle(error, { response, request }) {
    // Erros de validação (request.validate() falhou) já vêm com status 422
    // e a lista de mensagens em error.messages.
    if (error.code === 'E_VALIDATION_FAILED') {
      return response.status(422).json({
        message: 'Dados inválidos.',
        errors: error.messages,
      })
    }

    if (error.code === 'E_ROW_NOT_FOUND') {
      return response.status(404).json({ message: 'Registro não encontrado.' })
    }

    return super.handle(error, { response, request })
  }

  async report(error, { request }) {
    return super.report(error, { request })
  }
}

module.exports = ExceptionHandler
