'use strict'

const { DateTime } = require('luxon')

const OrdemServico = use('App/Models/OrdemServico')
const CreateOrdemServico = use('App/Validators/CreateOrdemServico')

class OrdensServicoController {
  // GET /api/v1/ordens-servico
  async index({ request }) {
    const { page = 1, perPage = 20, status } = request.qs()

    const query = OrdemServico.query()
      .preload('tecnico') // eager load: já traz o técnico junto, evita N+1 query
      .orderBy('data_abertura', 'desc')

    if (status) {
      query.where('status', status)
    }

    return query.paginate(page, perPage)
  }

  // POST /api/v1/ordens-servico
  async store({ request, response }) {
    const dados = await request.validate(CreateOrdemServico)

    const os = await OrdemServico.create(dados)

    return response.status(201).json(os)
  }

  // GET /api/v1/ordens-servico/:id
  async show({ params, response }) {
    const os = await OrdemServico.query()
      .where('id', params.id)
      .preload('tecnico')
      .first()

    if (!os) {
      return response.status(404).json({ message: 'OS não encontrada.' })
    }

    return os
  }

  // PUT /api/v1/ordens-servico/:id
  async update({ params, request, response }) {
    const os = await OrdemServico.find(params.id)

    if (!os) {
      return response.status(404).json({ message: 'OS não encontrada.' })
    }

    const dados = request.only([
      'titulo',
      'descricao',
      'status',
      'prioridade',
      'tecnico_id',
    ])

    os.merge(dados)
    await os.save()

    return os
  }

  // DELETE /api/v1/ordens-servico/:id
  async destroy({ params, response }) {
    const os = await OrdemServico.find(params.id)

    if (!os) {
      return response.status(404).json({ message: 'OS não encontrada.' })
    }

    await os.delete()

    return response.status(204).send()
  }

  // PATCH /api/v1/ordens-servico/:id/concluir
  // Exemplo de rota "de ação" (fora do CRUD padrão) apontando pro
  // mesmo controller — igual existe hoje em wo-tech.functions.ts.
  async concluir({ params, response }) {
    const os = await OrdemServico.find(params.id)

    if (!os) {
      return response.status(404).json({ message: 'OS não encontrada.' })
    }

    os.status = 'concluida'
    os.data_conclusao = DateTime.local()
    await os.save()

    return os
  }
}

module.exports = OrdensServicoController
