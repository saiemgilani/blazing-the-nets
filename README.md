# Blazing the Nets

[![check](https://github.com/saiemgilani/blazing-the-nets/actions/workflows/check.yml/badge.svg)](https://github.com/saiemgilani/blazing-the-nets/actions/workflows/check.yml)
[![data updated](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsportsdataverse%2F.github%2Fmain%2Fstatus%2Fbadges%2FhoopR-nba-stats-data%2Fupdated.json)](https://sportsdataverse.org/status)
[![data through](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsportsdataverse%2F.github%2Fmain%2Fstatus%2Fbadges%2FhoopR-nba-stats-data%2Fthrough.json)](https://sportsdataverse.org/status)

Brooklyn Nets shooting dashboards, from 2015-16 onward: hex shot charts, shooting signatures,
distance and side splits against the league, per-game filters, a league scatter and rolling
leaderboards. Built with Next.js 16 and pure d3 v7 (the individual d3 modules, no wrapper library).
Live at [blazingthenets.com](https://blazingthenets.com). Every number is read at request time from
public [sportsdataverse-data](https://github.com/sportsdataverse/sportsdataverse-data) GitHub release
parquet (`nba_stats_shots`, `nba_stats_player_season_stats`, `nba_stats_player_game_logs`,
`espn_nba_player_core` and `espn_nba_rosters`), which the
[hoopR-nba-stats-data](https://github.com/sportsdataverse/hoopR-nba-stats-data) producer refreshes
nightly. Data freshness: [sportsdataverse.org/status](https://sportsdataverse.org/status).

## Views

- **Home** (`/`): the Nets roster for a season, by attempts, each card with FGA, FG%, eFG%, games and minutes.
- **Player dashboard** (`/players/<id>`): league ranks, a game selector (presets, single games, a date window), six shot charts against the league, a rolling 5/10/20-game line and FG% against each opponent.
- **Team dashboard** (`/teams/<id>`): the team's six shot charts against the league and a sortable, keyboard-driven roster table.
- **Players** (`/players?team=`): every shooter for a team, or the whole league with `team=all`.
- **Teams** (`/teams`): all 30 teams with attempts, FG% and eFG%.
- **Scatter** (`/scatter`): every player with 100+ FGA on two chosen metrics, with median crosshairs, zoom and headshot faces.
- **Leaders** (`/leaders`): the best current 5, 10 and 20-game windows for FG%, eFG%, 3P% and most improved.
- **About** (`/about`): sources, methods and credits.

Every view takes `?season=<endYear>` (for example `?season=2025` for 2024-25); without it the
current season is shown.

## Inspiration and attribution

- The shot-chart views take their cue from the original 2021 Blazing the Nets by the same author.
- The hex court follows [Buckets](https://buckets.peterbeshai.com/) by Peter Beshai.
- `/scatter` is modelled on [Scattershot](https://scattershot.peterbeshai.com/) by Peter Beshai.
- `/leaders` is modelled on [Shotline](https://shotline.peterbeshai.com/) by Peter Beshai.
- The team roster table is modelled on [databallr](https://databallr.com/).

This site is not affiliated with, or endorsed by, any of those projects, the NBA or the Brooklyn
Nets. No code, copy or brand assets from them are used. Player headshots are loaded from ESPN CDN
URLs; the site shows no team logos.

Licensed under the [MIT licence](LICENSE).

## Data

| Release tag | Asset | Used for |
| --- | --- | --- |
| `nba_stats_shots` | `shots_<endYear>.parquet` | every shot chart, split, scatter point and leaderboard |
| `nba_stats_player_season_stats` | `player_season_stats_<endYear>.parquet` | games, minutes, PTS/g, FGA/g, eFG%, TS%, usage, PIE |
| `nba_stats_player_game_logs` | `player_game_logs_<endYear>.parquet` | game dates, opponents, home/away/neutral, wins and losses |
| `espn_nba_player_core` | `player_core_<endYear>.parquet` (2002+) | headshots (ESPN CDN URLs) |
| `espn_nba_rosters` | `rosters_<endYear>.parquet` (2025+) | headshot fallback |
| `nba_crosswalk` | `nba_player_crosswalk_<endYear>.parquet` (2026+) | stats.nba.com id to ESPN id |

Files are read with byte-range requests for only the columns a view uses, cached per process for
the 6-hour ISR window.

**Coordinates.** Shot locations are the stats.nba.com legacy frame: `x_legacy` and `y_legacy` in
tenths of a foot, hoop at the origin, y growing toward half court, the baseline at y = −52.5.
`lib/data/court.ts` is the only place that turns them into pixels.

**Colour.** Charts compare a player with the league at the same spot: red is above the league
rate, blue below (the 2021 site used red for below and green for above, which was not
colour-blind safe). Hex, zone and signature colours are shrunk toward the league rate with a
25-attempt prior,

```text
shown difference = (makes + 25 × league) / (attempts + 25) − league
```

so a 1-for-1 hex reads as about average; tooltips and labels show the raw makes and attempts.

**Headshots.** stats.nba.com and ESPN use different player ids. Headshots are matched by the
crosswalk first, then by a normalised full name that is unique in that season's ESPN file. The
crosswalk is incomplete (149 of its 544 rows for 2025-26 are unmatched), so today the name match
does most of the work; 561 of 582 shooters in 2025-26 get a headshot.

**Season rollover.** The site lists 2015-16 through the last known season. The next season
becomes current only when its shots file has a regular-season shot for all 30 teams and its
season-stats file exists; until then the previous season stays current.

## Development

- Node 24 or newer (`.nvmrc`), then `npm ci`.
- `npm run dev` starts the dev server.
- `npm run check` runs lint, typecheck, the offline tests and the production build (the build
  reads the release files over the network).
- `npm test` reads committed fixtures only; `BN_NETWORK_TESTS=1 npm test` also reads the real
  release files.
- Against a running build (`npm run build && npm start`): `node scripts/probe-routes.mjs` checks
  status codes and `node scripts/probe-ui.mjs` checks keyboard, touch and brush wiring in a
  browser (both exit 1 on a failed check; set `BASE_URL` if not `http://localhost:3000`).
- `npm run screenshots` takes full-page screenshots (390 and 1280 px, light and dark) into the
  git-ignored `img/visual/`. It needs a running build (`npm run build && npm start`, then set
  `BASE_URL` if it is not `http://localhost:3000`) and a Playwright browser
  (`npx playwright install chromium`, or `PW_CHANNEL=msedge` for an installed Edge).

## Deploy

The site deploys to Vercel through its Git integration: pushes to `main` go to production,
other branches get preview URLs, and there is no deploy step in CI. New data needs no deploy,
because pages revalidate every 6 hours. blazingthenets.com moved from Firebase to Vercel on
2026-09-30; the record of that cutover, its rollback and the open Firebase retirement step are in
[docs/DEPLOY.md](docs/DEPLOY.md).
