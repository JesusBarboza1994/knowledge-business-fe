import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT ?? 4173)
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

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
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
  } catch {
    response.writeHead(500).end('Internal server error')
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Knowledge Hub frontend listening on ${port}`)
})
