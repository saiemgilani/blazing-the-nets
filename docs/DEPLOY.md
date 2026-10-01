# Deploy: blazingthenets.com on Vercel

blazingthenets.com moved from Firebase Hosting to Vercel on 2026-09-30. Steps 1 to 6 below are
done and are kept as the record of how it was done and how to undo it. Step 7, retiring Firebase,
is still open.

## Current state (checked 2026-09-30, after the cutover)

- **The live domain.** blazingthenets.com serves this repository's `main` from the Vercel
  project. `BASE_URL=https://blazingthenets.com node scripts/probe-routes.mjs` passes 24/24.
  Canonical URLs, the sitemap (618 URLs) and `robots.txt` all use `https://blazingthenets.com`.
- **DNS.** Namecheap BasicDNS (`dns1/dns2.registrar-servers.com`), as seen by public resolvers:
  - apex: A `216.198.79.1` (TTL 1800 s), no AAAA;
  - `www`: CNAME to the project-specific `02a6d1287bc6f295.vercel-dns-017.com.`;
  - Vercel reports both domains as correctly configured, and the certificate is issued.
- **Redirects.** `www.blazingthenets.com` answers 308 (permanent) to the apex and keeps the path
  and query. `http://` answers 308 to `https://`. The apex sends
  `Strict-Transport-Security: max-age=63072000`.
- **The Vercel project.** `blazing-the-nets` in team `saiemgilanis-projects` (created March 2022),
  Git-connected to `saiemgilani/blazing-the-nets`, production branch `main` (the default branch was renamed from `master` on 2026-09-30). Domains:
  `blazingthenets.com` (primary), `www.blazingthenets.com` (308 to the apex) and
  `blazing-the-nets.vercel.app`.
- **Firebase.** The 2021 build is still published at blazing-the-nets.web.app and
  blazing-the-nets.firebaseapp.com. No DNS points at it. Retiring it is step 7.
- **Before the cutover** (for rollback): the apex had A records `151.101.1.195` and
  `151.101.65.195` (Fastly, Firebase's CDN), `www` resolved to the same two addresses and Firebase
  answered it with a 301 to the apex, and the TTL was 3601 s.

## Nightly data needs no deploy

- Pages are ISR, and each one revalidates within 6 hours of a request (`revalidate = 21600`).
- The release files are refreshed nightly by hoopR-nba-stats-data. A new night's data appears on
  the site without a Vercel deploy.
- The season rollover is automatic too (see the README). Once a year, after a season has become
  current, bump `LAST_KNOWN_SEASON` in `lib/seasonRange.ts` so the probe watches for the season
  after it.
- Deploy only for code changes. Each build also reads the release files (it prerenders the
  current season), so if GitHub is down the build fails and the previous deployment keeps
  serving.

## Steps

### 1. Vercel project settings (done 2026-09-30)

The project still had its 2021 settings, so every build of the rebuild branch failed with
`react-scripts: command not found`. On 2026-09-30 the settings were switched, a preview was
redeployed and it built (63/63 pages in 53 s).

| Setting | Old value (keep for rollback) | Current value |
| --- | --- | --- |
| Framework preset | Create React App | Next.js |
| Root directory | `public` | (empty: repository root) |
| Node.js version | 14.x | 24.x |
| Environment variables | none needed | none needed |

Also check **Settings → Functions**:

- **Fluid compute is on** (switched on 2026-09-30 through the project API, `resourceConfig.fluid`;
  it applies from the next deployment). On Hobby, Fluid compute gives functions a 300 s maximum
  duration and 2 GB of memory. Without it the Hobby default is 10 s (60 s at most).
- **Why it matters.** A cold player page builds the season-picker index (one shots file per
  season since 1997-98, four at a time: 3.6-4.1 s measured locally, alongside the page data). A
  season page reads a whole season of shots (a few seconds and a few hundred MB). That is well
  inside 300 s and 2 GB, and too close to a 10 s limit.
- **Image optimisation is not used.** Headshots are `unoptimized` (served straight from ESPN's
  CDN), so the Hobby image-optimisation quota does not apply.

### 2. Verify a preview (done 2026-09-30)

Every push to a branch other than `main` builds a preview. Open the preview from the Vercel
dashboard and check each of these:

- `/` shows the Nets roster for the current season.
- `/players/1629008` shows a player dashboard.
- `/teams/1610612751` shows the team dashboard.
- `/scatter` and `/leaders` render.
- `/players/123` is a real 404.
- `/players/1629008/current/opengraph-image` returns an image.

If Deployment Protection is on, preview URLs need a logged-in browser. A scripted check can then
use a protection-bypass token, or wait for step 3, where the production URL is public. The same
list as a script:

```sh
BASE_URL=https://<preview-or-production-url> node scripts/probe-routes.mjs   # exit 0 = all as expected
```

### 3. Merge to the default branch: the production deploy on the vercel.app domain (done 2026-09-30)

1. Merge the rebuild PR into `master`, as the default branch was then named (PR #1, merge commit `65024877`). Vercel builds production
   and serves it at <https://blazing-the-nets.vercel.app>.
2. The custom domain still points at Firebase at this point, so the public site does not change.
3. Run the probe against `https://blazing-the-nets.vercel.app` and click through the site.
4. Fix anything here, before the domain moves.

### 4. Add the domains in Vercel (done 2026-09-30)

1. In **Settings → Domains**, add `blazingthenets.com` and `www.blazingthenets.com`.
2. Make the apex the primary domain and let `www` redirect to it with a **308**, which keeps the
   path. Vercel's default for a new redirect is 307 (temporary); pick 308 in the domain's edit
   dialog. Like Firebase's old 301 it is permanent; unlike a 301 it also keeps the request method.
   The apex is the canonical host, as `homepage` in `package.json` says.
3. Vercel then shows the DNS records it expects for each. Use what that panel shows; the steps
   below give the defaults at the time of writing.

### 5. Change DNS at Namecheap (done 2026-09-30; Domain List → Manage → Advanced DNS)

1. **Lower the TTL first.** A day ahead, set the TTL of the existing apex and `www` records to the
   minimum (1 min or 5 min), so the switch and any rollback spread quickly.
2. **Record the current values** before you change anything (they are listed above), for rollback.
3. **Apex.** Delete the two A records `151.101.1.195` and `151.101.65.195`. Add an A record for
   host `@` with what the Vercel panel shows. On 2026-09-30 the panel recommended
   `216.198.79.1` and `64.29.17.1`; the older `76.76.21.21` also works. The cutover used
   `216.198.79.1`.
4. **www.** Delete its A records and add a CNAME for host `www` with value `cname.vercel-dns.com.`
   (or the project-specific value the panel shows).
5. **AAAA.** Remove any AAAA records that point at Firebase or Fastly. Vercel needs none.
6. **CAA.** If there are CAA records, allow `letsencrypt.org`, which Vercel uses to issue
   certificates.
7. **Leave the rest alone.** Keep unrelated records (MX, SPF/TXT for mail and so on). Any Firebase
   verification TXT record can stay until step 7.

### 6. Verify the new site is serving (done 2026-09-30, probe 24/24)

1. **DNS.** Query the authoritative server so no cache gets in the way:

   ```sh
   nslookup blazingthenets.com dns1.registrar-servers.com       # expect 216.198.79.1
   nslookup -type=CNAME www.blazingthenets.com dns1.registrar-servers.com
   dig +short blazingthenets.com A @1.1.1.1                     # a public resolver, once its cache expires
   ```

2. **Vercel.** Watch **Settings → Domains** until both domains say *Valid Configuration* and the
   certificate is issued. This is usually minutes after DNS resolves.
3. **Headers.** A HEAD request on `https://blazingthenets.com/` should show `server: Vercel` and an
   `x-vercel-id` header; the old site has neither. Check `https://www.blazingthenets.com/` too: it
   should redirect to the apex.
4. **Probe.** Run `BASE_URL=https://blazingthenets.com node scripts/probe-routes.mjs`.
5. **Share preview.** Share a player URL and confirm the preview image renders.

### 7. Only then retire Firebase (open)

Wait until step 6 passes from more than one network, for at least a day and ideally a week (the
cutover was 2026-09-30, so not before 2026-10-01, ideally 2026-10-07). Then:

- **Remove the custom domain in Firebase.** Firebase console → Hosting → the custom domain →
  Remove.
- **Stop Firebase hosting.** Run `firebase hosting:disable --project blazing-the-nets`, or delete
  the Hosting site. This stops blazing-the-nets.web.app too.
- **Delete the unused GitHub secrets.** The deleted workflows used
  `FIREBASE_SERVICE_ACCOUNT_BLAZING_THE_NETS` and the six `REACT_APP_FB_*` / `REACT_APP_API_FB_KEY`
  secrets. Delete them in the repository settings.

### Rollback

- **Before step 7.** At Namecheap, put back the apex A records `151.101.1.195` and
  `151.101.65.195` and the matching `www` A records, and delete the Vercel A record
  (`216.198.79.1`) and the `www` CNAME.
  Firebase is still serving its last build, so the old site returns once the TTL runs out. The
  Vercel project needs no change.
- **After step 7.** Firebase must be redeployed first:
  1. Check out the last 2021 commit of the default branch (`65024877^1`, the parent of the rebuild merge).
  2. Build it with Node 14 (`npm install && npm run build`).
  3. Run `firebase deploy --only hosting --project blazing-the-nets`.
  4. Re-add the custom domain in Firebase, then restore the DNS as above.
- **Running the old app on Vercel instead.** Put back the old project settings from the table
  in step 1 (Create React App, `public`, 14.x) and redeploy the old commit.

## What could go wrong

- **DNS TTL.** Resolvers keep old answers until the TTL runs out, and ISP resolvers sometimes keep
  them longer. Lower the TTL a day ahead. During the switch some visitors see the old site and
  some the new one, which is harmless.
- **www and apex.** Both hosts need a record at Namecheap and an entry in Vercel. If only the apex
  moves, `www` keeps serving the old Firebase redirect (to the new apex, so it works, but through
  Firebase). If only `www` is added in Vercel, the apex shows Vercel's "no deployment" error.
- **HTTPS certificate wait.** Vercel issues the certificate only after DNS points at it. Until
  then `https://` can show a certificate error on the new IP. The apex already sends HSTS, so
  browsers will not fall back to `http://`; wait for *Valid Configuration* before judging. A CAA
  record that leaves out `letsencrypt.org` blocks issuance entirely.
- **Cold ISR after the first deploy.** Only the current season's pages are prerendered at build:
  home, the Nets player list, the teams list, all 30 team pages, the Nets players, scatter and
  leaders. Every other player, and every past season, renders on its first request, which takes a few seconds while the release files are read, then
  is cached for 6 hours. Each new deploy starts that cache over. A slow first click after a
  deploy is expected, not an outage.
- **Function limits.** If Fluid compute were ever turned off, a cold season page could hit the 10 s Hobby default
  and return a 504. Keep Fluid compute on (step 1) rather than raising `maxDuration` per route.
- **Preview protection.** Scripted checks against preview URLs get 401 or a login page when
  Deployment Protection is on. It does not affect the production domain.
