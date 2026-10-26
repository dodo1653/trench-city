# Trench City

A night city that builds itself from live pump.fun launches. Every building is a real coin. The data comes from our relay (`trench-relay.trenchcounty.workers.dev/v1/feed`).

## What each piece shows

**Each building is a coin:**
- Height follows the coin's market cap.
- Launches rise floor by floor.
- Every buy sends light up the facade; big buys flare.
- When the dev sells half or more, the windows black out from the top down. If the price then breaks (below 62 % of its pre-sale peak 20 s later), the building sinks into dust.
- Graduated coins get a gold-lit crown.
- Coins that go quiet dim slowly.

**Around the city:**
- Sodium street lighting spreads as the city grows.
- A camera director flies to the biggest live moments.

**The site:**
- Drag or scroll to look around; "Auto camera" hands control back to the director.
- Click a building for its coin card: market cap, a chart since launch, holders, dev %, top 10, the latest real trades, a pump.fun link and Copy CA.
- Search a ticker or CA to fly to that coin.
- Deep links: `?coin=<CA>`.

## Files
- `index.html` is the whole site.
  - Live mode by default; it polls `/api/feed` every 3 s.
  - `?replay=data/replay.json&from=S&dur=D` is a frame-accurate capture mode for `render.mjs`.
- `api/feed.js` is a Vercel edge function that proxies the relay. The relay sends no CORS header.
- `serve.mjs` is the local dev server on port 8791: static files plus the same `/api/feed` proxy. Start it with `node serve.mjs`.
- `collect.py N` records N minutes of the live feed into `data/replay.json`, for captures.
- `render.mjs` drives headless Edge.
  - `node render.mjs "<url>" frames 30` writes the frames.
  - `SNAP=ms` takes one live screenshot.
  - `EVAL=` evaluates JavaScript in the page.
- `sound.mjs events.json out.wav` synthesizes the sound for a capture: a rain and city bed, a slow D-minor pad, and one sound per real event. Export the events with `EVAL="JSON.stringify(window.clipEvents())"`.

## Capture recipe

1. Run `python collect.py 16`.
2. Find the best window: `EVAL="window.bestFrom(30)"`.
3. Render the frames with `&from=<best>&dur=30&sol=<SOL price>`.
4. Export the events and build the sound with `sound.mjs`.
5. Encode with ffmpeg: frames + sound, 1 s fade in and out.

## The project's own coin (the landmark)
The tower in the centre plaza is our coin. `project.config.js` holds everything about it, all of it public on-chain information.

`api/project.js` reads the dev wallets and the lock straight from Solana: `getTokenSupply`, `getTokenAccountsByOwner` and `getTokenAccountBalance` on the public RPC, cached for 15 s.

**Our rule:** if the dev bag ever drops below `devInitialTokens` (beyond a 0.5 % rounding allowance), other than into the listed lock, the tower goes dark and the card says "Dev sold". It works exactly like every rug in the city. Anyone can verify it: the wallets are linked to Solscan.

### Launch-day checklist
1. Launch on pump.fun from the dev wallet. Note the CA and how many tokens the dev buy got. That's the "dev bag" (pump.fun shows it; Solscan has it in the launch transaction).
2. Fill in `mint` and `devInitialTokens` in `project.config.js`, and add `{ label: 'Dev wallet', owner: '<dev wallet>' }` to `devWallets`.
3. Lock the dev bag on Streamflow (app.streamflow.finance → Token Lock):
   - token = the CA;
   - amount = the dev bag (or most of it);
   - unlock date, e.g. 6–12 months out;
   - recipient = the dev wallet.

   Then:
   - Copy the contract page link into `lock.url` and the date into `lock.until`.
   - Add the lock's escrow token account (it's on the contract page / Solscan) as `{ label: 'Locked (Streamflow)', tokenAccount: '<escrow>', locked: true }`.

   A transfer into the lock is not a sale: both places count toward the dev bag.
4. Push the commit. Vercel redeploys and the landmark goes live with the real figures.

## Open source
MIT licensed (`LICENSE`). Everything that runs the site is in this repo: the city, the feed proxy and the dev-wallet check.
