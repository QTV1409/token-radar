# token-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/QTV1409/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/QTV1409/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Launch Radar ranks 198 pre-token protocols by an implied value — what a token might be worth if the protocol launched one, priced the way the market prices the tokens that already trade. Every row carries a concrete farm plan with costs and times.

## The model

```
implied value = TVL × category multiple × growth multiplier × age multiplier
```

- **Category multiple**: the median market-cap / TVL ratio of the snapshot's tokened protocols in the same category (at least 3 of them, otherwise the global median), clamped to 0.05–1.50. Recomputed from the snapshot on every run — no protocol name is ever special-cased.
- **Growth multiplier**: 1 + (7-day TVL change, clamped to −50%…+150%) × 0.40.
- **Age multiplier**: 0.85 + 0.15 × (days since first tracked, capped at 4 years) / 4 years.

The board covers all 40 watchlist protocols plus every other rankable pre-token protocol in the snapshot (198 rows). Live-token protocols are never ranked; they are the comparables the multiples are calibrated from.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` (Node 22, standard library only) reads the sealed snapshot, writes `board.json`, `data.js`, the dashboard and the screenshots into the output directory, and writes `dossier.json` with the vendored make.fun library. Two runs over the same snapshot write the same bytes.

Open `out/dashboard/index.html` in a browser: the board is sortable and filterable by category, chain and TVL, and every row opens a detail view with the four factors behind its rank and its six-step farm plan.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9qs5x4yn&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
