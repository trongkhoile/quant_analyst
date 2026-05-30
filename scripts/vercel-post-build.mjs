import { cp, mkdir, writeFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const funcDir = '.vercel/output/functions/__server.func'

await mkdir(funcDir, { recursive: true })
await mkdir('.vercel/output/static', { recursive: true })

// Copy entire server bundle into the Vercel function directory
await cp('dist/server', funcDir, { recursive: true, force: true })

// Copy static client files
if (existsSync('dist/client')) {
  await cp('dist/client', '.vercel/output/static', { recursive: true, force: true })
}

// Nitro v3 exports { fetch(req, context) } (Web API / Cloudflare style),
// but Vercel Node.js runtime needs a standard (req, res) handler.
// Create a wrapper that adapts between the two formats.
const wrapper = `
import app from './index.mjs'

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto']?.split(',')[0]?.trim() || 'https'
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url || '/', proto + '://' + host)

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
  }

  const method = req.method || 'GET'
  const hasBody = !['GET', 'HEAD'].includes(method)

  let body = null
  if (hasBody) {
    body = await new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })
  }

  const webReq = new Request(url.href, { method, headers, body })
  const webRes = await app.fetch(webReq, { waitUntil: () => {} })

  res.statusCode = webRes.status
  for (const [k, v] of webRes.headers) res.setHeader(k, v)

  const buf = Buffer.from(await webRes.arrayBuffer())
  res.end(buf)
}
`.trimStart()

await writeFile(`${funcDir}/_handler.mjs`, wrapper)

// Tell Vercel to use the wrapper as the entry point
await writeFile(`${funcDir}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: '_handler.mjs',
  launcherType: 'Nodejs'
}, null, 2))

console.log('✓ .vercel/output/functions/__server.func ready')
console.log('✓ .vercel/output/static ready')
