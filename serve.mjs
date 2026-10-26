// local dev server: static files + /api/feed proxied to the relay (port 8791)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.dirname(fileURLToPath(import.meta.url))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname === '/api/project') {            // run the edge function locally (it only uses fetch + Response)
    try { const m = await import('./api/project.js?t=' + Date.now()); const r = await m.default(new Request('http://x' + req.url)); res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(await r.text()) }
    catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: String(e) })) }
    return
  }
  if (u.pathname === '/api/feed') {
    try { const r = await fetch('https://trench-relay.trenchcounty.workers.dev/v1/feed?since=0', { headers: { 'user-agent': 'trench-city' } }); res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(await r.text()) }
    catch (e) { res.writeHead(502); res.end('{}') }
    return
  }
  const f = path.join(ROOT, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname))
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
}).listen(8791, '127.0.0.1', () => console.log('http://127.0.0.1:8791'))
