# Overnight run: baseline audit

Run date: 2026-09-18. Branch: `overnight/seo-monetisation`, cut from `origin/main` at `da868ec` (2026-09-12).
Worktree: `~/hack/miketineo/the-audacity/projects/direct-flights-overnight` on atlas. The main checkout
(`.../direct-flights`) was left untouched: it sits on `design/v2-midnight` with Miguel's uncommitted
"Night Approach" redesign, and its local `main` is 20+ commits behind origin.

## Headline

Most of the run's stated objectives were already shipped on `origin/main` between 2026-09-11 and
2026-09-12 (per-airport pages, sitemap, robots, privacy page, ads.txt, AdSense script and reserved
slots). This audit records the verified live state so the remaining work is the genuine delta, not a
re-implementation.

## Live verification (2026-09-18, from atlas)

| Check | Result |
|---|---|
| `https://flydirectfrom.com/` | 200, 8.6 KB HTML |
| `https://flights.miketineo.com/` | 301 to `https://flydirectfrom.com/` |
| `/sitemap.xml` | 200, 3162 `<loc>` entries, all `lastmod` 2026-09-11 |
| `/robots.txt` | 200, `Allow: /` + sitemap pointer |
| `/privacy` | 200 |
| `/ads.txt` | 200, `google.com, pub-1142224973470587, DIRECT, f08c47fec0942fa0` |
| `/from` (country hub) | 200, 338 KB |
| `/from/FCO` | 200, 137 KB, per-page title/description/og/canonical |
| `/from/fco` | 301 to `/from/FCO` |
| `/from/ZZZ` | 404 |
| `/from/FCO/` | 307 to `/from/FCO` (temporary redirect; see follow-ups) |
| `/countries/italy` | 200; `/countries/Italy` 301; unknown slug 404 |
| `/about-the-data` | 200 |
| `adsbygoogle.js` on every page | yes, `client=ca-pub-1142224973470587` |
| CMP script in HTML | none beyond adsbygoogle.js (Google's own CMP rides on it once enabled in the console) |
| JSON-LD structured data | none |
| Container | `ghcr.io/theaudacityio/direct-flights:latest`, up 5 days, healthy, loopback 3080 |
| CI | last 6 runs on `main` green (CI + Deploy) |

## Repo quality gates at baseline (node 22 container, `npm ci` on `da868ec`)

| Gate | Result |
|---|---|
| `npm test` | 69 pass, 0 fail |
| `npm run typecheck` | clean |
| `npm run lint` | 1 error (`src/lib/app-data/client.server.ts:214` empty catch block, Grok-template residue) + 1 warning (unused eslint-disable in `src/lib/auth/use-current-user.ts:59`) |

`ci.yml` runs test + typecheck + build but not lint, so the lint error never blocked a deploy.
SUCCESS.md lists lint as a quality gate.

## How per-airport pages are generated

- Route files: `src/routes/from.$iata.tsx` (airport), `src/routes/countries.$slug.tsx` (country),
  `src/routes/from.index.tsx` (country hub). All server-rendered by TanStack Start with loaders that
  call server functions in `src/lib/flights/pages.ts`, which read the static JSON under `public/data/`
  through `dataset.server.ts` (dynamic import, never bundled client-side).
- URL contract: `/from/{IATA}` uppercase canonical, lowercase 301s, unknown or destination-less
  codes 404. `/countries/{slug}` lowercase canonical, other casing 301s.
- SEO text helpers are pure and tested: `src/lib/flights/seo.ts` + `seo.test.ts` (title,
  description, canonical path, slug, nearby airports, glance stats, provenance sentence, sitemap XML).
- Pages carry: breadcrumb links (plain HTML, no schema), one h1, destination table with
  Verified/Archive provenance chips, "At a glance" stats, nearby airports within 400 km, a
  methodology paragraph, two reserved ad spaces, and the shared crawlable footer.
- Head tags per page: title, description, og:title/description/url, canonical. Root adds
  og:site_name/type/image, twitter:card, theme-color.

## Sitemap and robots story

- `public/sitemap.xml` is a build artefact written by `scripts/build-openflights.ts` via
  `buildSitemap()` and committed alongside the data (decision 2026-09-11: the origin set only changes
  when the data does). Contains `/`, `/from`, `/about-the-data`, `/privacy`, 222 country pages and
  2936 airport pages (3162 total, well under the 50k limit, 280 KB uncompressed).
- `public/robots.txt`: allow all, sitemap pointer. No crawl traps to block; `?from=` query URLs
  resolve to the canonical `/`.
- Not yet submitted to Google Search Console (PLANE.md Now #2, human gate).

## Privacy, consent, ads.txt status

- Privacy page: `src/routes/privacy.tsx`, updated 2026-09-12, names The Audacity as
  operator/controller, describes AdSense, Google's consent dialog, 14-day log retention, OpenFreeMap
  tiles, no analytics on `main`. Linked from every SSR page footer and the map's info surface.
- ads.txt: live with the real publisher id (not a placeholder). SUCCESS.md's ads.txt verify passes.
- AdSense: `src/lib/ads/config.ts` + `src/components/ads/AdSlot.tsx`. Script on every page; three
  manual display slots render a labelled "Ad space reserved" box until the numeric unit ids arrive as
  `VITE_ADSENSE_SLOT_AIRPORT / _COUNTRY / _SIDEBAR` build args. Rewarded unlock (`RewardGate`) is
  free-unlock until `VITE_REWARDED_AD_UNIT` exists.
- CMP: design decision already taken in code and docs: Google's certified CMP (AdSense "Privacy &
  messaging", TCF 2.2, delivered by adsbygoogle.js). The footer "Ad choices" button calls
  `googlefc.showRevocationMessage()`. Nothing to add client-side; the gate is the console step.
- No Consent Mode v2 gtag snippet, and none is needed: there is no Google Analytics or gtag on
  `main`; AdSense with Google's CMP handles consent signalling itself.

## Gaps against SUCCESS.md (definition of done)

| Criterion | State on 2026-09-18 |
|---|---|
| Site live and healthy | met |
| Pipeline green on main | met |
| Per-airport pages crawlable with served sitemap | met by the verify command (3162 > 100) but still unchecked in SUCCESS.md |
| Privacy policy page live and linked | met by the verify command, still unchecked |
| AdSense approved and serving | both verify commands pass (ads.txt line, adsbygoogle present); approval itself is a console gate |
| EEA consent in place | console gate (publish the GDPR message); code side ready |
| First revenue signal | blocked on the two above |

## Delta this run can safely take

1. Fix the lint error/warning so `npm run lint` is green, and add lint to `ci.yml`.
2. JSON-LD (PLANE.md Now #5b): BreadcrumbList on airport and country pages, WebSite on the home
   page, CollectionPage/WebPage where useful. Pure helper + tests, no visual change.
3. Update SUCCESS.md checkboxes to what the verify commands now show, with dates.
4. Document the CMP plan, placements and the remaining console steps in
   `docs/overnight/monetisation.md`; record human gates in `docs/overnight/blocked.md`.

## Follow-ups noticed, not taken

- `/from/FCO/` answers 307 (TanStack default trailing-slash handling). Google treats 307 as
  temporary; a 301 would be cleaner. Low value while the sitemap only lists slash-less URLs.
- The map page still ships the full airports index and MapLibre on first load (PLANE.md Now #5d).
  Out of scope overnight: needs a measured plan, not a blind change.
- All 3162 sitemap entries share one `lastmod`; per-origin lastmod (from `lastSeen`) would help
  Google prioritise the Verified origins. Cheap, but it changes a data build artefact, so it belongs
  in the monthly refresh change, not here.
