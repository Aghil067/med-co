const { createReadStream, statSync } = require('node:fs')
const { extname, resolve, sep } = require('node:path')
const { pipeline } = require('node:stream/promises')

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
}

function serveFrontend(directory) {
  const root = resolve(directory)
  const index = resolve(root, 'index.html')
  if (!statSync(index).isFile()) throw new Error('Build the frontend before starting the hosted service.')

  return async (request, response, pathname) => {
    if (!['GET', 'HEAD'].includes(request.method) || pathname.startsWith('/api/')) return false
    let file
    try {
      file = resolve(root, '.' + decodeURIComponent(pathname))
    } catch {
      return false
    }
    if (!file.startsWith(root + sep) && file !== root) return false
    if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
      if (extname(file) || pathname.startsWith('/assets/')) return false
      file = index
    }
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    })
    if (request.method === 'HEAD') response.end()
    else await pipeline(createReadStream(file), response)
    return true
  }
}

module.exports = serveFrontend
