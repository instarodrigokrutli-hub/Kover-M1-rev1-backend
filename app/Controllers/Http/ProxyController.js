'use strict'

/*
|--------------------------------------------------------------------------
| app/Controllers/Http/ProxyController.js
|--------------------------------------------------------------------------
|
| Repassa (proxy) qualquer requisição que não seja "/api/v1/*" para o
| frontend (incluindo "/", a home), que roda como um processo Node separado
| em localhost:3503
| (variável FRONTEND_URL). Existe para que, de fora, tudo (site + API)
| pareça uma coisa só numa porta só (a mesma que já expõe a API hoje) —
| sem precisar de nenhuma configuração de proxy externo (IIS ou outro).
|
| Repassa o corpo, o método e os cabeçalhos da requisição original, e faz
| streaming da resposta de volta sem bufferizar — importante porque o
| frontend em produção ainda envia a página HTML por streaming (SSR).
|
*/

const http = require('http')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:3503'
const target = new URL(FRONTEND_URL)

// Cabeçalhos que não devem ser repassados adiante (hop-by-hop).
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
])

// O BodyParser do Adonis (middleware global) já consome e interpreta o
// corpo da requisição ANTES do controller rodar — então o stream bruto
// (req) chega aqui vazio para POST/PUT/PATCH. Por isso, para métodos com
// corpo, reconstruímos o JSON a partir do que o Adonis já leu
// (request.raw() quando disponível, senão request.post()) em vez de
// tentar repassar o stream original (que travaria esperando bytes que
// nunca chegam).
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

class ProxyController {
  async forward(ctx) {
    const { request, response } = ctx
    const req = request.request
    const res = response.response

    const headers = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (!HOP_BY_HOP.has(key.toLowerCase())) headers[key] = value
    }
    headers['x-forwarded-host'] = req.headers.host || ''
    headers['x-forwarded-proto'] = 'http'

    let bodyBuffer = null
    if (METHODS_WITH_BODY.has(req.method)) {
      const raw = request.raw()
      const bodyStr = raw !== null && raw !== undefined ? raw : JSON.stringify(request.post())
      bodyBuffer = Buffer.from(bodyStr, 'utf-8')
      headers['content-type'] = headers['content-type'] || 'application/json'
      headers['content-length'] = String(bodyBuffer.length)
    } else {
      delete headers['content-length']
    }

    await new Promise((resolve) => {
      const proxyReq = http.request(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port,
          path: req.url,
          method: req.method,
          headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers)
          proxyRes.pipe(res)
          proxyRes.on('end', resolve)
        }
      )

      proxyReq.on('error', (err) => {
        if (!res.headersSent) {
          res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
        }
        res.end(`Frontend indisponível em ${FRONTEND_URL} (${err.code || err.message}).`)
        resolve()
      })

      if (bodyBuffer) {
        proxyReq.end(bodyBuffer)
      } else {
        proxyReq.end()
      }
    })
  }
}

module.exports = ProxyController
