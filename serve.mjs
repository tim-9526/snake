import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = 4443

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
}

const options = {
  key:  fs.readFileSync(path.join(__dirname, '.cert.key')),
  cert: fs.readFileSync(path.join(__dirname, '.cert.crt')),
}

https.createServer(options, (req, res) => {
  let urlPath = req.url.split('?')[0]
  if (urlPath === '/') urlPath = '/index.html'

  const filePath = path.join(DIST, urlPath)
  const ext = path.extname(filePath)

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    fs.createReadStream(path.join(DIST, 'index.html')).pipe(res)
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  HTTPS static server\n')
  console.log(`  ➜  Local:   https://localhost:${PORT}/`)
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  ➜  Network: https://${iface.address}:${PORT}/`)
      }
    }
  }
  console.log()
})
