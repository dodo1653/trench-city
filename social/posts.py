# Trench City X posts (no Premium: 280 characters a post, video up to 2:20, links go in a reply).
# Run to print every post with its length; anything over 280 fails loudly.
P = {}

P['1_clip'] = """Every building in this city is a real pump.fun coin.

Buys light it up.
When the dev sells, the lights go out.

Built live from the chain, every few seconds."""

P['1_clip_reply'] = """Walk around it yourself, click any building to see the coin behind it:
[site link]"""

P['2_stat'] = """We watched pump.fun for 16 minutes.

129 coins launched.
104 devs sold half their bag or more.
The median dev sold 7 seconds after launch.

In our city, you watch those lights go out."""

P['2_stat_reply'] = """Method: every launch where the dev bought 0.1 SOL or more, tracked live from the chain. "Dev sold" = the creator's wallet sold at least half its bag. Same rule the city uses."""

P['3_thread_1'] = """How Trench City works (1/5)

Every new pump.fun coin gets a building. The more it's worth, the taller it stands."""

P['3_thread_2'] = """(2/5) Every real buy sends a pulse of light up its tower. Big buys flare.

Coins nobody trades anymore go dark slowly, like offices at night."""

P['3_thread_3'] = """(3/5) When the dev sells, the windows black out from the top floor down.

If the price breaks after that, the building sinks into dust. You watch it happen live."""

P['3_thread_4'] = """(4/5) Coins that graduate get a lit crown and stay on the skyline.

Click any building: market cap, holders, dev %, top 10, the last trades, straight from the chain."""

P['3_thread_5'] = """(5/5) Search any ticker or CA and fly to it.

No wallet, no sign-up. Just the trenches, as a city.
[site link]"""

P['4_trust'] = """The tower in the middle of the city is ours.

Our dev wallet is on it, read live from the chain.
If we ever sell, it goes dark like every rug around it.

Same rules for us as for everyone else."""

P['4_trust_reply'] = """The dev share will also be time-locked, with the lock linked on the site. The code is open source, so anyone can check that the city shows the chain and nothing else."""

P['5_soon'] = """Our coin's tower already stands in the middle of the city.

It's dark for now. It lights up the day we launch, and it stays lit only as long as the dev never sells."""

P['6_report_template'] = """Trench City, last 24h

[N] coins launched
[D] devs sold ([P]%)
Fastest exit: [S] seconds after launch
Biggest buy: [B] SOL into $[TICKER]
Graduated: [G]

The skyline never lies."""

P['7_rug_clip_template'] = """$[TICKER] launched at [TIME].

The dev sold [S] seconds later.

Here's what that looks like from the street."""

P['8_question'] = """If every pump.fun launch was a building, how long would yours stay lit?"""

for k, v in P.items():
    n = len(v)
    flag = 'OK ' if n <= 280 else 'TOO LONG'
    print(f'--- {k}  [{n} chars] {flag}\n{v}\n')
    assert n <= 280, k
