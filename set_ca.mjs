// Launch day: node set_ca.mjs <CA> [devWallet] [--dry]
// Reads the launch from the chain (the dev wallet = who paid for the create transaction, the dev bag = its first
// token balance), writes project.config.js, then commits and pushes so Vercel goes live with it.
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const [CA, DEV_ARG] = args.filter((a) => !a.startsWith('--'))
if (!CA) { console.log('usage: node set_ca.mjs <CA> [devWallet] [--dry]'); process.exit(1) }
const RPC = 'https://api.mainnet-beta.solana.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function rpc(method, params) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
    const j = await r.json().catch(() => ({}))
    if (j.result !== undefined) return j.result
    await sleep(800 * (i + 1))
  }
  throw new Error('RPC failed: ' + method)
}

// 1. the oldest signatures on the mint (page back to the very first)
let before, sigs = []
for (;;) {
  const page = await rpc('getSignaturesForAddress', [CA, { limit: 1000, ...(before ? { before } : {}) }])
  sigs = sigs.concat(page)
  if (page.length < 1000) break
  before = page.at(-1).signature
}
sigs.reverse()
if (!sigs.length) throw new Error('no transactions found for ' + CA)
// 2. the create transaction's fee payer is the dev; the dev bag is their first token balance on this mint
const txOf = (sig) => rpc('getTransaction', [sig, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed', commitment: 'confirmed' }])
const first = await txOf(sigs[0].signature)
const dev = DEV_ARG || first.transaction.message.accountKeys[0].pubkey
let bag = 0
for (const s of sigs.slice(0, 25)) {
  const tx = s === sigs[0] ? first : await txOf(s.signature)
  const b = (tx?.meta?.postTokenBalances || []).find((x) => x.mint === CA && x.owner === dev)
  if (b && +b.uiTokenAmount.uiAmount > 0) { bag = +b.uiTokenAmount.uiAmount; break }
  await sleep(150)
}
console.log('CA         ', CA)
console.log('dev wallet ', dev, DEV_ARG ? '(given)' : '(paid for the create transaction)')
console.log('dev bag    ', bag.toLocaleString('en-US'), 'tokens', bag ? '' : '(no dev buy found: the sold check stays off)')

// 3. write the config (the lock entries, if any, are kept)
const P = (await import('./project.config.js?' + Date.now())).default
const wallets = [{ label: 'Dev wallet', owner: dev }, ...P.devWallets.filter((w) => w.locked)]
const src = `// The project's own coin. Set on launch day by set_ca.mjs (${new Date().toISOString().slice(0, 10)}).
// Everything here is public on-chain information: the site only reads it.
export default ${JSON.stringify({ ...P, mint: CA, devInitialTokens: bag, devWallets: wallets }, null, 2)}
`
if (DRY) { console.log('\n--dry: config not written\n' + src); process.exit(0) }
fs.writeFileSync(new URL('./project.config.js', import.meta.url), src)
// 4. commit + push: Vercel redeploys within a minute
const run = (c) => execSync(c, { cwd: fileURLToPath(new URL('.', import.meta.url)), stdio: 'inherit' })
run('git add project.config.js')
run(`git -c user.name="dodo1653" -c user.email="sameh.mohsen.78@gmail.com" commit -q -m "Set the CA: ${CA}" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`)
run('git push -q origin main')
console.log('\npushed. The landmark goes live at https://trenchcity.vercel.app within a minute.')
