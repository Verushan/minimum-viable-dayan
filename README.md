# Minimum Viable Dayan

Pick the fewest tabla dayan (treble drum) tunings needed to cover a session of bhajans / songs.

Each song has a performance root (Sa) and a raga. For every song, each of the 12 pitches is scored
as a dayan tuning:

| Tier | Weight | Condition |
|---|---|---|
| Sa | 1.00 | always |
| Pa *or* Ma | 0.85 | Pa if the raga has it as vadi/samvadi; otherwise shuddha Ma if present; otherwise Pa if present |
| the other of Pa/Ma | 0.60 | when the raga has it |
| Vadi / Samvadi | 0.50 / 0.45 | any other emphasised note |
| Other | 0.30 Ga/Dha · 0.15 Re/Ni | any other note the raga uses |
| Forbidden | 0 | notes the raga omits, or a minor 2nd / tritone / major 7th above Sa |

The optimizer then brute-forces every combination of candidate drums and reports, for each kit
size, the kit that covers the most songs above a threshold (default 0.70) with the highest total
score.

- **No drums entered:** any of the 12 tunings may be suggested (up to 4 drums).
- **Your dayans entered:** only those drums are considered. A drum's range (fixed, ±1, ±2, ±3
  semitones) is how far it can be *set* before the session; it then stays at one pitch for every
  song — no retuning between songs is assumed. If the drums can't cover the set, the tool names
  the single extra drum that would help most.
- **Singer adjustments:** for each song, the tool checks whether moving its Sa a semitone up or
  down would let the current drums cover it, or would reduce the number of drums needed, and
  offers the change with one tap.

Weights live in `src/data/weights.ts`; ragas in `src/data/ragas.ts` (add entries there — a test
validates every entry).

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # engine + raga dataset tests
npm run check    # svelte-check / type check
npm run build    # static site in dist/
```

Setlists persist to `localStorage` and to the URL hash, so a session can be shared as a link.

## Deploy

Pushing to `main`/`master` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub
Pages. In the repo settings, set **Pages → Source** to *GitHub Actions* once.
