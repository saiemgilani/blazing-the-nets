# Deploy: moving blazingthenets.com from Firebase to Vercel

A runbook for the owner. Run the steps in order. The old site stays up until the new one is
confirmed serving on the real domain, and every step up to step 7 can be undone by putting back
the DNS records.

## Current state (checked 2026-09-30)

- **The live domain.** blazingthenets.com serves the 2021 Create React App build from Firebase
  Hosting (project `blazing-the-nets`, also at blazing-the-nets.web.app).
- **DNS.** The domain uses Namecheap BasicDNS (`dns1/dns2.registrar-servers.com`), with a default
  TTL of 3601 s.
  - The apex has two A records, `151.101.1.195` and `151.101.65.195` (Fastly, Firebase's CDN).
  - `www` resolves to the same two addresses, and Firebase answers it with a 301 to the apex.
  - The apex sends `Strict-Transport-Security: max-age=31556926`.
- **The Vercel project.** It already exists and is connected to this repo:
  - name `blazing-the-nets`, team `saiemgilanis-projects`, created March 2022;
  - Git-connected to `saiemgilani/blazing-the-nets`, production branch `master`;
  - its only domain is `blazing-the-nets.vercel.app`, which returns 404 today because no
    production build has succeeded yet.
- **The Firebase deploy on master.** `master` still carries the 2021 workflows
  (`.github/workflows/firebase-hosting-merge.yml` and friends), which build the CRA app and deploy
  it to Firebase on every push to `master`. The rebuild branch deletes them. After the merge,
  pushes to `master` deploy to Vercel only, and Firebase keeps serving its last build until the
  DNS moves.

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

- **Fluid compute should be on.** On Hobby, Fluid compute gives functions a 300 s maximum
  duration and 2 GB of memory. Without it the Hobby default is 10 s (60 s at most).
- **Why it matters.** A cold player page builds the season-picker index (about 3.6 s measured
  locally, two release files at a time, alongside the page data). A season page reads a whole
  season of shots (a few seconds and a few hundred MB). That is well inside 300 s and 2 GB, and
  too close to a 10 s limit.
- **Image optimisation is not used.** Headshots are `unoptimized` (served straight from ESPN's
  CDN), so the Hobby image-optimisation quota does not apply.

### 2. Verify a preview

Every push to `rebuild/next16-d3` builds a preview. The last one checked is
<https://blazing-the-nets-lkvckj1e0-saiemgilanis-projects.vercel.app>. Open the preview from the
Vercel dashboard and check each of these:

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

### 3. Merge to master: the production deploy on the vercel.app domain

1. Merge the rebuild PR into `master`. Vercel builds production and serves it at
   <https://blazing-the-nets.vercel.app>.
2. The custom domain still points at Firebase, so the public site does not change yet.
3. Run the probe against `https://blazing-the-nets.vercel.app` and click through the site.
4. Fix anything here, before the domain moves.

### 4. Add the domains in Vercel

1. In **Settings → Domains**, add `blazingthenets.com` and `www.blazingthenets.com`.
2. Make the apex the primary domain and let `www` redirect to it. That matches today's behaviour
   and `homepage` in `package.json`.
3. Vercel then shows the DNS records it expects for each. Use what that panel shows; the steps
   below give the current defaults.

### 5. Change DNS at Namecheap (Domain List → Manage → Advanced DNS)

1. **Lower the TTL first.** A day ahead, set the TTL of the existing apex and `www` records to the
   minimum (1 min or 5 min), so the switch and any rollback spread quickly.
2. **Record the current values** before you change anything (they are listed above), for rollback.
3. **Apex.** Delete the two A records `151.101.1.195` and `151.101.65.195`. Add an A record for
   host `@` with value `76.76.21.21` (or what the Vercel panel shows).
4. **www.** Delete its A records and add a CNAME for host `www` with value `cname.vercel-dns.com.`
   (or the project-specific value the panel shows).
5. **AAAA.** Remove any AAAA records that point at Firebase or Fastly. Vercel needs none.
6. **CAA.** If there are CAA records, allow `letsencrypt.org`, which Vercel uses to issue
   certificates.
7. **Leave the rest alone.** Keep unrelated records (MX, SPF/TXT for mail and so on). Any Firebase
   verification TXT record can stay until step 7.

### 6. Verify the new site is serving

1. **DNS.** Query the authoritative server so no cache gets in the way:

   ```sh
   nslookup blazingthenets.com dns1.registrar-servers.com       # expect 76.76.21.21
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

### 7. Only then retire Firebase

Wait until step 6 passes from more than one network, for at least a day and ideally a week. Then:

- **Remove the custom domain in Firebase.** Firebase console → Hosting → the custom domain →
  Remove.
- **Stop Firebase hosting.** Run `firebase hosting:disable --project blazing-the-nets`, or delete
  the Hosting site. This stops blazing-the-nets.web.app too.
- **Delete the unused GitHub secrets.** The deleted workflows used
  `FIREBASE_SERVICE_ACCOUNT_BLAZING_THE_NETS` and the six `REACT_APP_FB_*` / `REACT_APP_API_FB_KEY`
  secrets. Delete them in the repository settings.

### Rollback

- **Before step 7.** At Namecheap, put back the apex A records `151.101.1.195` and
  `151.101.65.195` and the matching `www` A records, and delete the Vercel A and CNAME records.
  Firebase is still serving its last build, so the old site returns once the TTL runs out. The
  Vercel project needs no change.
- **After step 7.** Firebase must be redeployed first:
  1. Check out the last 2021 commit of `master` (before the merge).
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
- **Function limits.** If Fluid compute is off, a cold season page can hit the 10 s Hobby default
  and return a 504. Turn Fluid compute on (step 1) rather than raising `maxDuration` per route.
- **Preview protection.** Scripted checks against preview URLs get 401 or a login page when
  Deployment Protection is on. It does not affect the production domain.
- **Pushing to master too early.** Until the rebuild branch is merged, `master` still has the
  Firebase workflow. A push to `master` from anywhere else would redeploy the 2021 app to
  Firebase and also start a Vercel production build of that commit, which fails on the new
  settings and leaves production as it was. Merge the rebuild branch first.
