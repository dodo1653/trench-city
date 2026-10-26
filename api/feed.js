// Vercel edge function: same-origin proxy for the relay's live feed (the relay sends no CORS header)
export const config = { runtime: 'edge' }
export default async function handler() {
  const r = await fetch('https://trench-relay.trenchcounty.workers.dev/v1/feed?since=0', { headers: { 'user-agent': 'trench-city' }, cache: 'no-store' })
  return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'public, s-maxage=2, stale-while-revalidate=4' } })
}
