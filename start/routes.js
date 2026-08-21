'use strict'

/*
|--------------------------------------------------------------------------
| start/routes.js
|--------------------------------------------------------------------------
|
| Aqui ficam TODAS as rotas da API: qual URL + verbo HTTP chama qual
| método de qual controller. É o "mapa" da aplicação — quando você
| quiser saber "o que existe nessa API", comece por aqui.
|
| O controller é referenciado como STRING ('TecnicosController.index').
| O Adonis só importa o arquivo de fato quando a rota é chamada
| (lazy loading) — por isso o app sobe mais rápido.
|
*/

const Route = use('Adonis/Core/Route')

// Rota simples, só pra confirmar que a API está no ar.
Route.get('/', async () => {
  return { status: 'ok', app: 'kover-manutencao-backend' }
})

/*
|--------------------------------------------------------------------------
| Grupo /api/v1
|--------------------------------------------------------------------------
|
| Route.group agrupa rotas que compartilham um prefixo (e, se quiser,
| um middleware). Todo módulo novo (Máquinas, Materiais, Preventivas...)
| entra aqui dentro, seguindo o mesmo padrão dos dois exemplos abaixo.
|
*/
Route.group(() => {
  // ---- Técnicos -----------------------------------------------------
  // Route.resource cria automaticamente as 7 rotas RESTful padrão:
  //   GET    /tecnicos          -> index   (listar)
  //   POST   /tecnicos          -> store   (criar)
  //   GET    /tecnicos/:id      -> show    (mostrar 1)
  //   PUT    /tecnicos/:id      -> update  (atualizar)
  //   DELETE /tecnicos/:id      -> destroy (remover)
  // .apiOnly() remove as rotas "create" e "edit" (que só fazem sentido
  // pra formulário HTML server-side, não pra uma API JSON).
  Route.resource('tecnicos', 'TecnicosController').apiOnly()

  // ---- Ordens de Serviço ---------------------------------------------
  Route.resource('ordens-servico', 'OrdensServicoController').apiOnly()

  // Exemplo de rota "extra", fora do CRUD padrão, presa a um recurso:
  Route.patch(
    'ordens-servico/:id/concluir',
    'OrdensServicoController.concluir'
  )
}).prefix('api/v1')
