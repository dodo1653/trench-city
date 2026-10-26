// Vercel edge function: the project coin's live state, read straight from the chain (dev wallets, lock) and the relay (market data).
import P from '../project.config.js'
export const config = { runtime: 'edge' }
const RPCS = ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com']
async function rpc(method, params) {
  for (const u of RPCS) {
    try {
      const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
      const j = await r.json()
      if (j.result !== undefined) return j.result
    } catch {}
  }
  throw new Error('rpc ' + method)
}
const out = (o, ttl = 15) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json', 'cache-control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}` } })
export default async function handler() {
  const base = { ticker: P.ticker, name: P.name, mint: P.mint, lock: P.lock, rule: 'If the dev bag ever drops below its launch size (other than into the public lock), this tower goes dark.' }
  if (!P.mint) return out({ ...base, live: false }, 60)
  try {
    const [supply, ...bals] = await Promise.all([
      rpc('getTokenSupply', [P.mint]),
      ...P.devWallets.map((w) => w.tokenAccount
        ? rpc('getTokenAccountBalance', [w.tokenAccount]).then((r) => +r.value.uiAmount || 0)
        : rpc('getTokenAccountsByOwner', [w.owner, { mint: P.mint }, { encoding: 'jsonParsed' }]).then((r) => r.value.reduce((s, a) => s + (+a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0))),
    ])
    const total = +supply.value.uiAmount || 1e9
    const wallets = P.devWallets.map((w, i) => ({ label: w.label, address: w.owner || w.tokenAccount, locked: !!w.locked, tokens: bals[i], pct: bals[i] / total * 100 }))
    const dev = bals.reduce((s, v) => s + v, 0)
    const devSold = P.devInitialTokens > 0 && dev < P.devInitialTokens * (1 - P.tolerance)
    let market = null
    try { market = await (await fetch('https://trench-relay.trenchcounty.workers.dev/v1/coin?mint=' + P.mint, { headers: { 'user-agent': 'trench-city' } })).json() } catch {}
    return out({ ...base, live: true, supply: total, devInitialTokens: P.devInitialTokens, devTokens: dev, devPct: dev / total * 100,
      lockedPct: wallets.filter((w) => w.locked).reduce((s, w) => s + w.pct, 0), devSold, wallets, market, checkedAt: Date.now() })
  } catch (e) {
    return out({ ...base, live: true, error: String(e.message || e) }, 5)
  }
}
