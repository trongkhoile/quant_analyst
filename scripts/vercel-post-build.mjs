import { cp, mkdir, writeFile } from 'node:fs/promises'
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

// Tell Vercel how to run this function
await writeFile(`${funcDir}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs'
}, null, 2))

console.log('✓ .vercel/output/functions/__server.func ready')
console.log('✓ .vercel/output/static ready')
