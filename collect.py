# Trench City: records the live relay for a replay capture. Polls every 3 s for MINUTES and merges every coin's
# ticks / trades / dev events by time, so data/replay.json holds a full timeline of everything the relay saw.
import json, time, sys, urllib.request
MIN = float(sys.argv[1]) if len(sys.argv) > 1 else 15
URL = "https://trench-relay.trenchcounty.workers.dev/v1/feed?since=0"
coins, whales, t_end = {}, {}, time.time() + MIN * 60
def merge(a, b):
    seen = {tuple(x[:2]) for x in a}
    return sorted(a + [x for x in b if tuple(x[:2]) not in seen], key=lambda x: x[0])
n = 0
while time.time() < t_end:
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))
        for c in d["coins"]:
            o = coins.get(c["id"])
            if o:
                for k in ("ticks", "tr", "de"):
                    c[k] = merge(o.get(k) or [], c.get(k) or [])
                c["first"] = o["first"]
            else:
                c["first"] = d["now"]
            c["last"] = d["now"]
            coins[c["id"]] = c
        for w in d.get("whales") or []:
            whales[json.dumps(w, sort_keys=True)] = w
        n += 1
        if n % 10 == 1:
            json.dump({"start": min(c["first"] for c in coins.values()) if coins else d["now"], "now": d["now"], "coins": list(coins.values()), "whales": list(whales.values())}, open("data/replay.json", "w"))
            print(n, "coins", len(coins), flush=True)
    except Exception as e:
        print("err", e, flush=True)
    time.sleep(3)
json.dump({"start": min(c["first"] for c in coins.values()), "now": d["now"], "coins": list(coins.values()), "whales": list(whales.values())}, open("data/replay.json", "w"))
print("DONE", len(coins))
