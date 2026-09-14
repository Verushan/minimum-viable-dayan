# Minimum Viable Dayan

Pick the fewest tabla dayan (treble drum) tunings needed to cover a session of bhajans / songs.

Each song has a performance root (Sa) and a raga. For every song, each of the 12 pitches is scored
as a dayan tuning:

| Tier | Weight | Condition |
|---|---|---|
| Sa | 1.00 | always |
| Vadi | 0.85 | the raga's primary note, whatever swara it is |
| Samvadi | 0.70 | the raga's secondary note |
| Other | 0.55 Pa · 0.45 Ma · 0.30 Ga/Dha · 0.15 Re/Ni | any other note the raga uses |
| Forbidden | 0 | notes the raga omits, or a minor 2nd / tritone / major 7th above Sa |

The optimizer then brute-forces every combination of up to 4 tunings and reports, for each kit size,
the kit that covers the most songs above a threshold (default 0.70) with the highest total score.
Optionally a drum may be treated as retunable ±1–2 semitones.

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
