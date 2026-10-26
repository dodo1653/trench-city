// The project's own coin. Fill this in on launch day; nothing else needs to change.
// Everything here is public on-chain information: the site only reads it.
export default {
  ticker: 'CITY',                 // shown on the landmark before and after launch
  name: 'Trench City',
  mint: '',                       // the CA, once launched ('' = the landmark shows "coming soon")
  // the dev's bag, as it was right after launch (tokens). Any drop below this, other than into the lock, counts as a sale.
  devInitialTokens: 0,
  // every place the dev bag may sit. owner = a wallet address; tokenAccount = a token account address (use this for the lock escrow).
  devWallets: [
    // { label: 'Dev wallet', owner: '...' },
    // { label: 'Locked (Streamflow)', tokenAccount: '...', locked: true },
  ],
  lock: { url: '', until: '' },   // the public Streamflow contract page and the unlock date (YYYY-MM-DD)
  tolerance: 0.005,               // 0.5 %: rounding / dust never counts as a sale
}
