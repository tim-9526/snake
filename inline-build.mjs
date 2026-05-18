import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, 'dist')
const htmlPath = path.join(dist, 'index.html')

let html = fs.readFileSync(htmlPath, 'utf8')

// Strip leading base path (e.g. /snake/) then resolve under dist/
function resolveAsset(href) {
  // Remove leading slash + optional single base segment (e.g. /snake/assets/... → assets/...)
  const rel = href.replace(/^\/[^/]+\//, '').replace(/^\//, '')
  const full = path.join(dist, rel)
  if (fs.existsSync(full)) return full
  // Fallback: strip only leading slash
  const fallback = path.join(dist, href.replace(/^\//, ''))
  return fs.existsSync(fallback) ? fallback : null
}

// Inline <link rel="stylesheet" href="...">
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*\/?>/g, (_, href) => {
  const file = resolveAsset(href)
  if (!file) return ''
  return `<style>${fs.readFileSync(file, 'utf8')}</style>`
})

// Inline <script ... src="..."> — handles crossorigin and modulepreload variants
html = html.replace(/<link rel="modulepreload"[^>]*href="[^"]*"[^>]*\/?>/g, '')
html = html.replace(/<script([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g, (_, pre, src, post) => {
  const file = resolveAsset(src)
  if (!file) return ''
  // Keep type="module" if present, strip crossorigin and src
  const attrs = (pre + post).replace(/\bcrossorigin\b/g, '').replace(/\bsrc="[^"]*"/g, '').trim()
  return `<script${attrs ? ' ' + attrs : ''}>${fs.readFileSync(file, 'utf8')}</script>`
})

fs.writeFileSync(htmlPath, html)

const size = (fs.statSync(htmlPath).size / 1024).toFixed(0)
console.log(`✓ Inlined → dist/index.html (${size} KB)`)
