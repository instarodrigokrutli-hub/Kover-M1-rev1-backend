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

// IMPORTANTE: nenhuma rota deve ficar fora deste grupo (prefixo /api/v1).
// Qualquer rota registrada "solta" aqui em cima, como "/" ou "/health",
// roda ANTES do proxy pro frontend (fim do arquivo) e rouba esse caminho
// dele — foi exatamente isso que aconteceu com "/" até 2026-09-16 (a home
// de verdade nunca aparecia, só respondia um JSON de health-check). Por
// isso o health-check mora dentro do grupo agora, sem exceção nenhuma.
Route.group(() => {
  Route.get('health', async () => {
    return { status: 'ok', app: 'kover-manutencao-backend' }
  })

  // ---- Auth (admin/coordenador/produção) -----------------------------
  Route.post('auth/login', 'AuthController.login')
  Route.post('auth/claim-first-admin', 'AuthController.claimFirstAdmin')
  Route.get('auth/me', 'AuthController.me').middleware(['auth'])
  Route.patch('auth/password', 'AuthController.changePassword').middleware(['auth'])
  Route.patch('auth/turno', 'AuthController.updateMyTurno').middleware(['auth'])

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
  // index/show: lidos tanto por usuários quanto por técnicos (anyAuth) — a
  // OS interna do técnico precisa listar/criar máquinas na hora de abrir.
  Route.resource('machines', 'MachinesController').apiOnly().middleware({
    index: ['anyAuth'],
    show: ['anyAuth'],
    store: ['auth'],
    update: ['auth'],
    destroy: ['auth'],
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
  // Precisa vir ANTES do Route.resource('materials', ...) — senão GET /materials/:id
  // (show) capturaria "generate-code" como :id.
  Route.get('materials/generate-code', 'MaterialsController.generateCode').middleware(['auth'])

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
  Route.post('materials/search-similar', 'MaterialsController.searchSimilar').middleware(['auth'])
  Route.post('stock/adjust', 'StockController.adjust').middleware(['auth'])
  Route.get('stock/movements', 'StockController.index').middleware(['auth'])

  // ---- Auditoria (histórico geral de ações) ------------------------------
  Route.get('audit-logs', 'AuditLogsController.index').middleware(['auth'])

  // ---- Indicadores / Ativos (Fase 2 — leitura, sem tabela nova) ----------
  Route.post('indicators', 'IndicatorsController.index').middleware(['auth'])
  Route.get('indicators/filter-options', 'IndicatorsController.filterOptions').middleware(['auth'])
  Route.get('assets', 'AssetsController.index').middleware(['auth'])
  Route.get('assets/:id', 'AssetsController.show').middleware(['auth'])

  Route.post('withdrawals', 'WithdrawalsController.store').middleware(['techAuth'])
  Route.get('withdrawals/mine', 'WithdrawalsController.mine').middleware(['techAuth'])

  // ---- Atividades do técnico (Fase 2 — migrado do Supabase) --------------
  // mine/sectors precisam vir ANTES de tech-activities/:id — senão o GET
  // desses caía no show (mesmo problema documentado em materials/generate-code).
  Route.post('tech-activities', 'TechActivitiesController.store').middleware(['techAuth'])
  Route.post('tech-activities/route', 'TechActivitiesController.storeRoute').middleware(['techAuth'])
  Route.get('tech-activities/mine', 'TechActivitiesController.mine').middleware(['techAuth'])
  Route.get('tech-activities/sectors', 'TechActivitiesController.sectors').middleware(['auth'])
  Route.get('tech-activities', 'TechActivitiesController.index').middleware(['auth'])
  Route.get('tech-activities/:id', 'TechActivitiesController.show').middleware(['auth'])

  // ---- Compras (Fase 2 — migrado do Supabase) ----------------------------
  // Unidades
  Route.get('units', 'UnitsController.index').middleware(['anyAuth'])
  Route.post('units', 'UnitsController.store').middleware(['auth'])
  Route.put('units/:code', 'UnitsController.update').middleware(['auth'])

  // Fornecedores — select precisa vir antes de :id
  Route.get('suppliers/select', 'SuppliersController.forSelect').middleware(['auth'])
  Route.get('suppliers', 'SuppliersController.index').middleware(['auth'])
  Route.post('suppliers', 'SuppliersController.store').middleware(['auth'])
  Route.put('suppliers/:id', 'SuppliersController.update').middleware(['auth'])
  Route.post('suppliers/bulk-import', 'SuppliersController.bulkImport').middleware(['auth'])
  Route.get('suppliers/:id/history', 'StockReceiptsController.supplierHistory').middleware(['auth'])

  Route.get('materials/:id/acquisitions', 'SuppliersController.materialAcquisitions').middleware(['auth'])
  Route.get('materials/:id/timeline', 'StockReceiptsController.materialTimeline').middleware(['auth'])

  // Solicitações de compra — mine antes de :id
  Route.post('purchase-requests', 'PurchaseRequestsController.store').middleware(['auth'])
  Route.post('purchase-requests/tech', 'PurchaseRequestsController.storeTech').middleware(['techAuth'])
  Route.get('purchase-requests/mine', 'PurchaseRequestsController.mine').middleware(['techAuth'])
  Route.get('purchase-requests', 'PurchaseRequestsController.index').middleware(['auth'])
  Route.patch('purchase-requests/:id/approve', 'PurchaseRequestsController.approve').middleware(['auth'])
  Route.patch('purchase-requests/:id/reject', 'PurchaseRequestsController.reject').middleware(['auth'])

  // Materiais pendentes (não cadastrados) — mine antes de :id
  Route.post('pending-materials', 'PendingMaterialsController.store').middleware(['techAuth'])
  Route.get('pending-materials/mine', 'PendingMaterialsController.mine').middleware(['techAuth'])
  Route.get('pending-materials', 'PendingMaterialsController.index').middleware(['auth'])
  Route.post('pending-materials/:id/approve', 'PendingMaterialsController.approve').middleware(['auth'])
  Route.post('pending-materials/:id/reject', 'PendingMaterialsController.reject').middleware(['auth'])

  // Inventário inicial + recebimentos
  Route.get('inventory/status', 'StockReceiptsController.getInventoryStatus').middleware(['auth'])
  Route.post('inventory/finalize', 'StockReceiptsController.finalizeInventory').middleware(['auth'])
  Route.post('inventory/reopen', 'StockReceiptsController.reopenInventory').middleware(['auth'])
  Route.post('inventory/entries', 'StockReceiptsController.registerInitialEntry').middleware(['auth'])
  Route.get('receipts', 'StockReceiptsController.index').middleware(['auth'])
  Route.post('receipts', 'StockReceiptsController.store').middleware(['auth'])
  Route.get('receipts/:id', 'StockReceiptsController.show').middleware(['auth'])

  // ---- Preventivas (Fase 2 — migrado do Supabase) ------------------------
  Route.get('maintenance-plans', 'PreventiveController.index').middleware(['auth'])
  Route.post('maintenance-plans', 'PreventiveController.store').middleware(['auth'])
  Route.get('maintenance-plans/:id', 'PreventiveController.show').middleware(['auth'])
  Route.put('maintenance-plans/:id', 'PreventiveController.update').middleware(['auth'])
  Route.delete('maintenance-plans/:id', 'PreventiveController.destroy').middleware(['auth'])

  Route.post('maintenance-plan-items', 'PreventiveController.saveItem').middleware(['auth'])
  Route.post('maintenance-plan-items/reorder', 'PreventiveController.reorderItems').middleware(['auth'])
  Route.delete('maintenance-plan-items/:id', 'PreventiveController.deleteItem').middleware(['auth'])

  Route.post('preventives/generate', 'PreventiveController.generate').middleware(['auth'])
  Route.get('preventives/overview', 'PreventiveController.overview').middleware(['auth'])
  Route.get('preventives/indicators', 'PreventiveController.indicators').middleware(['auth'])
  Route.get('preventives', 'PreventiveController.list').middleware(['auth'])
  Route.get('preventives/:id', 'PreventiveController.show2').middleware(['auth'])
  Route.post('preventives/:id/validate', 'PreventiveController.validate').middleware(['auth'])
  Route.post('preventives/:id/cancel', 'PreventiveController.cancel').middleware(['auth'])

  // ---- Notificações + Push (Fase 2 — migrado do Supabase) ----------------
  Route.post('notifications/list', 'NotificationsController.index').middleware(['auth'])
  Route.get('notifications/unread-count', 'NotificationsController.unreadCount').middleware(['auth'])
  Route.patch('notifications/read-all', 'NotificationsController.markAllRead').middleware(['auth'])
  Route.patch('notifications/:id/read', 'NotificationsController.markRead').middleware(['auth'])
  Route.delete('notifications/:id', 'NotificationsController.destroy').middleware(['auth'])
  Route.post('notifications/sync-overdue-preventives', 'NotificationsController.syncOverduePreventives').middleware(['auth'])

  Route.get('notification-settings', 'NotificationSettingsController.index').middleware(['auth'])
  Route.post('notification-settings', 'NotificationSettingsController.save').middleware(['auth'])

  // Preferência pessoal (por usuário) — diferente de notification-settings,
  // que é por perfil e só o PCM configura.
  Route.get('notification-preferences/mine', 'UserNotificationPreferencesController.index').middleware(['auth'])
  Route.post('notification-preferences/mine', 'UserNotificationPreferencesController.save').middleware(['auth'])

  Route.post('push-devices', 'PushDevicesController.store')
  Route.post('push-devices/disable', 'PushDevicesController.disable')
  Route.get('push-devices/test-service-account', 'PushDevicesController.testServiceAccount')

  // ---- Ordens de Serviço (externas) --------------------------------------
  // index/show: lidos tanto por produção/PCM (JWT) quanto por técnicos
  // (cookie) — a tela do técnico lista/abre OS por este mesmo endpoint.
  Route.resource('work-orders', 'WorkOrdersController').apiOnly().middleware({
    index: ['anyAuth'],
    show: ['anyAuth'],
    store: ['auth'],
    update: ['auth'],
    destroy: ['auth'],
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
  // Precisa vir ANTES do Route.resource — senão GET /internal-work-orders/:id
  // (show, techAuth) capturaria "all" como :id.
  Route.get('internal-work-orders/all', 'InternalWorkOrdersController.indexAll').middleware(['auth'])

  Route.resource('internal-work-orders', 'InternalWorkOrdersController')
    .apiOnly()
    .middleware({ '*': ['techAuth'] })
}).prefix('api/v1')

// ---- Frontend (proxy interno) -----------------------------------------
// Tudo que não é "/api/v1/*" é repassado para o processo do frontend
// (localhost:3503 por padrão — ver ProxyController), incluindo "/" — a
// home de verdade do site. Assim o site inteiro (frontend + API) fica
// disponível numa porta só, sem precisar de nenhum proxy externo
// configurado à parte. Nenhuma rota deve ser registrada fora do grupo
// /api/v1 acima, ou ela vai roubar esse caminho do frontend em vez de
// ser repassada (ver comentário no início do grupo).
Route.any('*', 'ProxyController.forward')
