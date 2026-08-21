'use strict'

const Tecnico = use('App/Models/Tecnico')
const CreateTecnico = use('App/Validators/CreateTecnico')

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/TecnicosController.js
|--------------------------------------------------------------------------
|
| Um Controller só sabe falar "HTTP": recebe request, devolve response.
| Toda regra de negócio mais pesada normalmente fica no Model ou, em
| casos mais complexos, você pode criar uma pasta app/Services/ (não é
| padrão do Adonis, mas é uma convenção comum e combina bem com o
| projeto que vocês já têm hoje em src/server/services).
|
| Cada método aqui corresponde a uma linha do Route.resource() definido
| em start/routes.js.
|
*/
class TecnicosController {
  // GET /api/v1/tecnicos
  async index({ request }) {
    const { page = 1, perPage = 20, ativo } = request.qs()

    const query = Tecnico.query().orderBy('nome', 'asc')

    if (ativo !== undefined) {
      query.where('ativo', ativo === 'true')
    }

    return query.paginate(page, perPage)
  }

  // POST /api/v1/tecnicos
  async store({ request, response }) {
    const dados = await request.validate(CreateTecnico)

    const tecnico = await Tecnico.create(dados)

    return response.status(201).json(tecnico)
  }

  // GET /api/v1/tecnicos/:id
  async show({ params, response }) {
    const tecnico = await Tecnico.find(params.id)

    if (!tecnico) {
      return response.status(404).json({ message: 'Técnico não encontrado.' })
    }

    return tecnico
  }

  // PUT /api/v1/tecnicos/:id
  async update({ params, request, response }) {
    const tecnico = await Tecnico.find(params.id)

    if (!tecnico) {
      return response.status(404).json({ message: 'Técnico não encontrado.' })
    }

    const dados = request.only([
      'nome',
      'email',
      'telefone',
      'matricula',
      'ativo',
    ])

    tecnico.merge(dados)
    await tecnico.save()

    return tecnico
  }

  // DELETE /api/v1/tecnicos/:id
  async destroy({ params, response }) {
    const tecnico = await Tecnico.find(params.id)

    if (!tecnico) {
      return response.status(404).json({ message: 'Técnico não encontrado.' })
    }

    await tecnico.delete()

    return response.status(204).send()
  }
}

module.exports = TecnicosController
