'use strict'

/*
|--------------------------------------------------------------------------
| start/globals.js
|--------------------------------------------------------------------------
|
| Em projetos TypeScript, o @adonisjs/core reescreve chamadas use('Xyz')
| para global[Symbol.for('ioc.use')]('Xyz') em tempo de compilação (via
| @adonisjs/ioc-transformer). Como este projeto é JavaScript puro, essa
| reescrita nunca acontece, então precisamos do global "use" manualmente.
| Precisa ser carregado antes de qualquer arquivo que chame use(...).
|
*/
global.use = (namespace) => global[Symbol.for('ioc.use')](namespace)
global.make = (namespace) => global[Symbol.for('ioc.make')](namespace)
