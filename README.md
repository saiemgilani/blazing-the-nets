# Blazing the Nets

Brooklyn Nets shooting dashboards, rebuilt on Next.js 16 and d3 v7 (in progress on
`rebuild/next16-d3`; the 2021 React + Firebase build still serves blazingthenets.com).

## Data

Every number is read at request time from public
[sportsdataverse-data](https://github.com/sportsdataverse/sportsdataverse-data) release files
(parquet, byte-range reads of only the columns used), refreshed nightly by `hoopR-nba-stats-data`:

| Release tag | Asset | Used for |
|---|---|---|
| `nba_stats_shots` | `shots_<endYear>.parquet` (1997+) | every shot chart and split |
| `nba_stats_player_season_stats` | `player_season_stats_<endYear>.parquet` | games, minutes, eFG%, TS%, usage, PIE |
| `espn_nba_player_core` | `player_core_<endYear>.parquet` (2002+) | headshots (ESPN CDN URLs) |
| `espn_nba_rosters` | `rosters_<endYear>.parquet` (2025+) | headshot fallback |
| `nba_crosswalk` | `nba_player_crosswalk_<endYear>.parquet` (2026+) | stats.nba.com id to ESPN id |

Shot locations are the stats.nba.com legacy frame: tenths of a foot, hoop at the origin, y toward
half court.

stats.nba.com and ESPN use different player ids. Headshots are matched by the crosswalk first,
then by a normalised full name that is unique in that season's ESPN file. The crosswalk is
incomplete: 149 of its 544 rows for 2025-26 are unmatched (among them Jaylen Brown, LeBron James
and Nic Claxton), so today the name match does the work; 561 of 582 shooters in 2025-26 get a
headshot.

Colours compare a player with the league at the same spot: red is above the league rate, blue is
below. The 2021 site used red for below and green for above; that scale was not colour-blind safe,
and red-hot is what shot-chart readers expect now. Hex and zone colours are shrunk toward the
league rate with a 25-attempt prior, so a 1-for-1 hex reads as average; tooltips and labels show
the raw makes and attempts.

## Development

Node 24 (`.nvmrc`). `npm run check` runs lint, typecheck, the offline tests and the build.

- `npm test` reads committed fixtures only; `BN_NETWORK_TESTS=1 npm test` also reads the real
  release files.
- Visual check: `npm run build && npm start`, then `node scripts/screenshots.mjs` (390/768/1280 px,
  light and dark, into the git-ignored `img/visual/`). Locally `PW_CHANNEL=msedge` uses the
  installed Edge; CI installs Playwright's browser with `npx playwright install chromium`.
