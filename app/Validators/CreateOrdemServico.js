'use strict'

class CreateOrdemServico {
  get rules() {
    return {
      numero: 'required|string|max:30|unique:ordens_servicos,numero',
      titulo: 'required|string|max:150',
      descricao: 'string',
      status: 'string|in:aberta,em_andamento,concluida,cancelada',
      prioridade: 'string|in:baixa,media,alta,urgente',
      tecnico_id: 'integer|exists:tecnicos,id',
      data_abertura: 'required|date',
    }
  }

  get messages() {
    return {
      'numero.required': 'Informe o número da OS.',
      'numero.unique': 'Já existe uma OS com esse número.',
      'titulo.required': 'Informe o título da OS.',
      'tecnico_id.exists': 'Técnico informado não existe.',
      'data_abertura.required': 'Informe a data de abertura.',
    }
  }
}

module.exports = CreateOrdemServico
