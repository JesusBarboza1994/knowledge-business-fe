import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT ?? 4173)
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '')
const maxProxyBodyBytes = 26 * 1024 * 1024
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

async function readRequestBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxProxyBodyBytes) throw new Error('PAYLOAD_TOO_LARGE')
    chunks.push(chunk)
  }
  return chunks.length ? Buffer.concat(chunks) : undefined
}

async function proxyApiRequest(request, response, requestUrl) {
  if (!apiProxyTarget) {
    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ message: 'API_PROXY_TARGET is not configured' }))
    return
  }

  const targetPath = `${requestUrl.pathname.slice('/api'.length)}${requestUrl.search}`
  const headers = { ...request.headers }
  delete headers.host
  delete headers.connection
  delete headers['content-length']

  const method = request.method ?? 'GET'
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readRequestBody(request)
  const upstream = await fetch(`${apiProxyTarget}${targetPath}`, {
    method,
    headers,
    body,
    redirect: 'manual',
  })
  const responseHeaders = {
    'Cache-Control': 'no-store',
    'Content-Type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
  }
  const getSetCookie = upstream.headers.getSetCookie
  const cookies = typeof getSetCookie === 'function'
    ? getSetCookie.call(upstream.headers)
    : upstream.headers.get('set-cookie')
      ? [upstream.headers.get('set-cookie')]
      : []
  if (cookies.length) responseHeaders['Set-Cookie'] = cookies

  response.writeHead(upstream.status, responseHeaders)
  response.end(Buffer.from(await upstream.arrayBuffer()))
}

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    const pathname = decodeURIComponent(requestUrl.pathname)
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      await proxyApiRequest(request, response, requestUrl)
      return
    }

    const requested = resolve(root, `.${pathname}`)
    if (!requested.startsWith(root)) {
      response.writeHead(403).end('Forbidden')
      return
    }

    let file = requested
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
    } catch {
      file = resolve(root, 'index.html')
    }

    const body = await readFile(file)
    const extension = extname(file)
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' https: http://localhost:*; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    })
    response.end(body)
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
      response.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ message: 'Payload too large' }))
      return
    }
    response.writeHead(500).end('Internal server error')
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Knowledge Hub frontend listening on ${port}`)
})
