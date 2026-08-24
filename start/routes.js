'use strict'

/*
|--------------------------------------------------------------------------
| start/routes.js
|--------------------------------------------------------------------------
|
| Todas as rotas da API — Fase 1 da migração do Kover Manutenção.
|
*/

const Route = use('Adonis/Core/Route')

Route.get('/', async () => {
  return { status: 'ok', app: 'kover-manutencao-backend' }
})

Route.group(() => {
  // ---- Auth (admin/coordenador/produção) -----------------------------
  Route.post('auth/login', 'AuthController.login')
  Route.post('auth/claim-first-admin', 'AuthController.claimFirstAdmin')
  Route.get('auth/me', 'AuthController.me').middleware(['auth'])

  // ---- Usuários (admin-only) ------------------------------------------
  Route.get('users', 'UsersController.index').middleware(['auth'])
  Route.post('users', 'UsersController.store').middleware(['auth'])
  Route.put('users/:id', 'UsersController.update').middleware(['auth'])
  Route.patch('users/:id/role', 'UsersController.setRole').middleware(['auth'])

  // ---- Auth de técnico (sessão por cookie) ----------------------------
  Route.get('tech/technicians', 'TechAuthController.listActive')
  Route.post('tech/login', 'TechAuthController.login')
  Route.post('tech/logout', 'TechAuthController.logout').middleware(['techAuth'])
  Route.get('tech/me', 'TechAuthController.me').middleware(['techAuth'])

  // ---- Técnicos (CRUD admin) -------------------------------------------
  Route.resource('technicians', 'TechniciansController').apiOnly().middleware({
    '*': ['auth'],
  })

  // ---- Máquinas ---------------------------------------------------------
  Route.resource('machines', 'MachinesController').apiOnly().middleware({
    '*': ['auth'],
  })

  // ---- Categorias ---------------------------------------------------------
  Route.resource('categories', 'CategoriesController').apiOnly().middleware({
    '*': ['auth'],
  })

  // ---- Setores ---------------------------------------------------------
  Route.resource('sectors', 'SectorsController').apiOnly().middleware({
    '*': ['auth'],
  })

  // ---- Materiais / Estoque ----------------------------------------------
  // index/show: lidos tanto por usuários quanto por técnicos (anyAuth);
  // store/update/destroy exigem admin (checado dentro do controller).
  Route.resource('materials', 'MaterialsController').apiOnly().middleware({
    index: ['anyAuth'],
    show: ['anyAuth'],
    store: ['auth'],
    update: ['auth'],
    destroy: ['auth'],
  })
  Route.post('materials/bulk-import', 'MaterialsController.bulkImport').middleware(['auth'])
  Route.post('stock/adjust', 'StockController.adjust').middleware(['auth'])
  Route.get('stock/movements', 'StockController.index').middleware(['auth'])

  Route.post('withdrawals', 'WithdrawalsController.store').middleware(['techAuth'])
  Route.get('withdrawals/mine', 'WithdrawalsController.mine').middleware(['techAuth'])

  // ---- Ordens de Serviço (externas) --------------------------------------
  Route.resource('work-orders', 'WorkOrdersController').apiOnly().middleware({
    '*': ['auth'],
  })
  Route.patch('work-orders/:id/evaluate', 'WorkOrdersController.evaluate').middleware(['auth'])

  Route.patch('work-orders/:id/accept', 'WorkOrdersTechController.accept').middleware(['techAuth'])
  Route.patch('work-orders/:id/take-over', 'WorkOrdersTechController.takeOver').middleware(['techAuth'])
  Route.post('work-orders/:id/comments', 'WorkOrdersTechController.addComment').middleware(['techAuth'])
  Route.patch('work-orders/:id/execution', 'WorkOrdersTechController.updateExecution').middleware(['techAuth'])
  Route.post('work-orders/:id/materials', 'WorkOrdersTechController.addMaterial').middleware(['techAuth'])
  Route.patch('work-orders/:id/finish', 'WorkOrdersTechController.finish').middleware(['techAuth'])
  Route.patch('work-orders/:id/pause', 'WorkOrdersTechController.pause').middleware(['techAuth'])
  Route.patch('work-orders/:id/resume', 'WorkOrdersTechController.resume').middleware(['techAuth'])
  Route.patch(
    'work-orders/:id/checklist/:itemId',
    'WorkOrdersTechController.updateChecklistItem'
  ).middleware(['techAuth'])

  // ---- Ordens de Serviço Internas ----------------------------------------
  Route.resource('internal-work-orders', 'InternalWorkOrdersController')
    .apiOnly()
    .middleware({ '*': ['techAuth'] })
}).prefix('api/v1')
