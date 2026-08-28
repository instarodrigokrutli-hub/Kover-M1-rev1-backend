'use strict'

/*
|--------------------------------------------------------------------------
| app/Services/NotificationConstants.js
|--------------------------------------------------------------------------
|
| Réplica de src/lib/notifications-shared.ts (frontend) — mapas usados pelo
| Notify service para rotular/categorizar/priorizar eventos.
|
*/

const NOTIFICATION_TYPE_LABEL = {
  os_criada: 'Nova OS criada',
  os_assumida: 'Técnico assumiu atendimento',
  os_pausada: 'Atendimento pausado',
  os_retomada: 'Atendimento retomado',
  os_responsavel_alterado: 'Responsável alterado',
  os_concluida: 'OS concluída',
  os_reprovada: 'OS reprovada',
  os_reaberta: 'OS reaberta',
  preventiva_criada: 'Preventiva criada',
  preventiva_iniciada: 'Preventiva iniciada',
  preventiva_concluida: 'Preventiva concluída',
  preventiva_atrasada: 'Preventiva atrasada',
  sistema: 'Sistema',
}

const CATEGORY_BY_TYPE = {
  preventiva_criada: 'preventiva',
  preventiva_iniciada: 'preventiva',
  preventiva_concluida: 'preventiva',
  preventiva_atrasada: 'preventiva',
  sistema: 'sistema',
}

const PRIORITY_BY_TYPE = {
  os_criada: 'importante',
  os_assumida: 'informativa',
  os_pausada: 'importante',
  os_retomada: 'informativa',
  os_responsavel_alterado: 'informativa',
  os_concluida: 'importante',
  os_reprovada: 'critica',
  os_reaberta: 'critica',
  preventiva_criada: 'informativa',
  preventiva_iniciada: 'informativa',
  preventiva_concluida: 'importante',
  preventiva_atrasada: 'critica',
  sistema: 'informativa',
}

const PRIORITY_RANK = { informativa: 1, importante: 2, critica: 3 }

const PUSH_TYPES = new Set([
  'os_criada', 'os_assumida', 'os_pausada', 'os_retomada',
  'os_concluida', 'os_reaberta', 'preventiva_criada', 'preventiva_atrasada',
])

module.exports = { NOTIFICATION_TYPE_LABEL, CATEGORY_BY_TYPE, PRIORITY_BY_TYPE, PRIORITY_RANK, PUSH_TYPES }
