'use strict'

/*
|--------------------------------------------------------------------------
| dev-watch.js
|--------------------------------------------------------------------------
|
| Watcher do modo dev. `node --watch` (nativo) e `node ace serve --watch`
| (assembler) usam fs.watch/inotify por baixo dos panos, que não funciona
| em drives de rede/samba (erro "UNKNOWN: unknown error, watch" no Windows).
| Este script usa chokidar em modo polling, que funciona em qualquer
| sistema de arquivos, e reinicia `node server.js` a cada mudança.
|
*/

const chokidar = require('chokidar')
const { spawn } = require('child_process')
const path = require('path')

const WATCH_PATHS = ['app', 'config', 'start', 'providers', 'database/migrations', '.env']

let child = null
let restarting = false

function startServer() {
  child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
  })
}

function restartServer() {
  if (restarting) return
  restarting = true

  if (child) {
    child.once('exit', () => {
      restarting = false
      startServer()
    })
    child.kill()
  } else {
    restarting = false
    startServer()
  }
}

const watcher = chokidar.watch(WATCH_PATHS, {
  cwd: __dirname,
  usePolling: true,
  interval: 300,
  ignoreInitial: true,
})

watcher.on('all', (event, changedPath) => {
  console.log(`[dev-watch] ${event}: ${changedPath} — reiniciando servidor...`)
  restartServer()
})

process.on('SIGINT', () => {
  if (child) child.kill()
  process.exit(0)
})

startServer()
