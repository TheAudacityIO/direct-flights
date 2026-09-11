# PLANE.md

project: direct-flights
status: active
owner: miguel
repo: ~/hack/miketineo/the-audacity/projects/direct-flights

## About

A dark nonstop-route explorer. Search any airport, see every direct destination as animated great-circle arcs, and read airline, distance, and estimated duration in a sidebar (bottom sheet on mobile). First site of The Audacity's ad-funded free-sites portfolio (see MISSION.md). Roadmap single-source: this file; PLANNING.md carries decisions and session log only.

## Now

Resume queue for a fresh session; work top to bottom. State below is accurate as of 2026-09-11, commit e55835b (rename, purge, hero, SEO pages and the Grok banner removal shipped and verified live on flydirectfrom.com; see Done). Items 2 and 3 are HUMAN GATES (Google accounts); 4 waits on 3; 5 is code, conditional.

1. [ ] Basemap durable fix (Protomaps, self-hosted). Miguel rejected keyed SaaS on cost; direction: low-zoom planet extract (z0-10) in Cloudflare R2 on the personal account, served by the official PMTiles Cloudflare Worker (repo protomaps/PMTiles, serverless/cloudflare) on tiles.flydirectfrom.com, dark flavor via @protomaps/basemaps, Protomaps/OSM attribution. BLOCKED: R2 is not enabled on the account (wrangler error code 10042, dashboard-only enablement; needs Miguel or a console session). Recipe once enabled: `pmtiles extract https://build.protomaps.com/<latest>.pmtiles world-z10.pmtiles --maxzoom=10` (pmtiles CLI is in Homebrew; file is a few GB and NEVER enters git), bucket `flydirectfrom-tiles`, deploy the worker, then point FlightMap's primary style at it. Fallback if R2 keeps fighting: static range-request serving of the .pmtiles from atlas behind the tunnel. Current serving state: OpenFreeMap public dark style (keyless, donation-backed, no SLA) with the bundled land.geojson as error fallback; CARTO is gone (its courtesy tiles started watermarking API-KEY-REQUIRED on 2026-09-11).
2. [ ] Google Search Console: verify flydirectfrom.com (DNS TXT on the personal Cloudflare zone is the scriptable path), submit https://flydirectfrom.com/sitemap.xml, request indexing for /, /from, /from/FCO. Then watch coverage for the 2936 airport pages.
3. [ ] AdSense site verification: `public/ads.txt` live since 2026-09-11 (ccac046, `google.com, pub-1142224973470587, DIRECT, f08c47fec0942fa0`, verified 200 on apex and www). Miguel clicks Verify in AdSense (crawler re-fetch can lag hours), then Request review. Publisher id: `ca-pub-1142224973470587`.
4. [ ] Ads wiring: publisher id is `ca-pub-1142224973470587` (ads.txt shipped); waits for the AdSense review to pass and Miguel's data-tier/timing answers; then adsbygoogle, certified CMP (Consent Mode v2), rewarded-unlock loop per the Next section. Prerequisites now live: privacy page, canonical host, crawlable airport pages, sitemap, robots.
5. [ ] SEO follow-ups from the 2026-09-11 runbook review (docs/, uncommitted on purpose), gated on Search Console data: (a) if archive pages dominate "crawled, currently not indexed", cull them from the sitemap (freshness gate); (b) JSON-LD BreadcrumbList/WebPage; (c) per-page og:title (the Grok PWA head middleware in vite.config.ts injects a fixed og:title=FlyDirectFrom on every page); (d) T10 payload: the map page still ships the full 450 KB airports.json and MapLibre on first load. Rejected from the runbook: /routes/a-to-b pages (32k thin archive pages), URL scheme change, /?from= 301s (canonical covers it), 12-agent orchestration.

## Next

- [x] 2026-09-11: AdSense account exists, flydirectfrom.com added, publisher id `ca-pub-1142224973470587`; site review pending (Now #3).
- [ ] Wire monetization once the review passes: the `adsbygoogle` script, 1-2 conservative display slots (sidebar/bottom-sheet edge, never over the map), and a Google-certified CMP for EEA consent (Consent Mode v2).
- [ ] Rewarded-unlock loop (the FlightConnections-Premium counter): gate heavier features (date/time filters, schedule depth) behind a Google Ad Manager "rewarded ads for web" unit. Policy bounds: reward is granted after a 5s in-view ad, must be non-monetary and redeemable on-site only; interstitials only as between-navigation vignettes, NEVER popups on first load (intrusive-interstitial penalty + AdSense policy).
- [ ] Grow overlay coverage next quota reset (~2026-10-05): measured cost is 6 units per routes call, so the 400-unit free month covers ~50 origins (pinned CAG + top ~46 by rank, floor 100 units). This month runs CAG-only: the first metered run fetched the unpinned top-48 and its data was lost to the canary gate (288 units spent, salvage artifact added since). Upgrade to the $7.50 tier when ~50 origins/month stops being enough.
- [ ] Vault mirror of `AERODATABOX_API_KEY` into `secret/projects/direct-flights`: waits for Miguel's next OIDC `vault login` (the atlas AppRole policy cannot write that path and extending Vault policy is ask-first). Until then the key lives only as the repo's GitHub Actions secret. ⚠ The AeroDataBox overlay is the prerequisite for the rewarded premium features (schedule/frequency depth needs dated data).

## Later

- [ ] Enterprise-grade dated schedules (Amadeus production / OAG / Cirium) if the portfolio ever justifies it: revenue-gated, not a launch dependency. (Amadeus self-service was the original fast path; superseded by AeroDataBox 2026-09-10, see PLANNING.md decision log.)
- [ ] Portfolio site #2 using the same runbook + framework (pick the niche after direct-flights shows impressions).
- [ ] Ad-slot/layout tuning once there is traffic data worth reading.
- [ ] Lightweight analytics (PostHog free tier) if AdSense reporting alone proves too coarse.

## Backlog

- [ ] Basemap ownership: the CARTO courtesy-tile risk FIRED 2026-09-11 (tiles watermarked "API KEY REQUIRED"); emergency swap to OpenFreeMap's keyless public dark style shipped same day (attribution added, CARTO raster fallback tier removed). OpenFreeMap is donation-backed with no SLA either, so the durable fix stays: migrate to self-hosted Protomaps PMTiles (low-zoom planet extract served from our box, dark vector style, OSM attribution kept) BEFORE the AdSense launch drives volume. ~half a day. Rejected: OSM tile servers (policy-prohibited), Google (wrong stack + cost), Mapbox/MapTiler/Stadia (per-load or subscription against an RPM-thin ads business).
- [ ] Auth-on decision: only if a feature needs accounts (requires `DATABASE_URL` + Better Auth config on atlas; flag alone is not enough).
- [ ] PWA install-page artwork (Grok platform never exported it; stylesheet currently hides the gap).

## Done

- [x] 2026-09-11: SEO structure pass, revenue-weighted from the external runbook (e55835b): /from is a country hub (top 6 per country, 930 -> 338 KB), 222 /countries/{slug} pages (lowercase canonical, 301 otherwise, 404 unknown), airport pages gain At-a-glance + nearby airports (400 km) + country crumb + Verified/Archive paragraph, /about-the-data methodology page, shared crawlable footer, home title/og tags; sitemap 2939 -> 3163. All verified live.
- [x] 2026-09-11: Absorbed/renamed carriers shown as booked (26543c8): `src/lib/flights/successors.ts` (US Airways -> American on 1446 rows, Germanwings -> Eurowings, AirTran -> Southwest, legal-name cleanups); four more bankruptcies in defunct.ts (Go First, Shaheen, SkyWork, bmibaby); 32706 -> 32673 routes. Live: zero "US Airways" on /from/LHR.
- [x] 2026-09-11: Wet-lease operators branded as the airline users book (785328b): `src/lib/flights/operators.ts` maps Fly Air41 Airways -> "ITA Airways (operated by Fly Air41 Airways)" at observed-build time; 10 CAG rows affected, list search matches "ITA"; verified on the live CAG JSON. The daily-routes stats payload has no marketing/codeshare field (schema is destination + averageDailyFlights + operators), so the map is the fix. Sitemap gained FRL (5c9c918), which the reverse-fill had left uncommitted.
- [x] 2026-09-11: Observed legs mirrored onto unobserved destinations (5a32229): 68 origins gain a Verified CAG row, FCO regains CAG (observed, lastSeen 2026-09-10) after losing it in the purge; verified on the live JSON and /from/FCO (1 Verified, 118 Archive).
- [x] 2026-09-11: Grok "Created with" banner script (grok.com/grok-app-builder/extensions.js) no longer injected into any page (f4852d2); verified absent on /, /from/FCO and /privacy live. The privacy page's "no third-party scripts" claim is now true.
- [x] 2026-09-11: FlyDirectFrom rename shipped (cf70c55): identity + canonical on / and /privacy, host-redirect middleware runtime-smoked on the built node-server then verified live (flights.miketineo.com and www 301 to https://flydirectfrom.com with path+query kept; loopback health curl stays 200), privacy page live and naming OpenFreeMap.
- [x] 2026-09-11: Defunct-carrier purge (9db132d): `src/lib/flights/defunct.ts` (33 names, bankruptcies only), buildDataset strips them and drops pairs only they flew; 34018 -> 32664 routes, FCO 156 -> 118, FCO-CCS gone, CAG->DUB (Ryanair, observed) kept; verified on the live JSON. Provenance chips (Verified = has lastSeen, Archive = baseline) in DestinationList and RouteDetail.
- [x] 2026-09-11: Hero copy static (5f5eff3); meta.note rewritten to read for one or N observed airports.
- [x] 2026-09-11: Crawlable airport pages: /from/{IATA} (SSR, 301 lowercase, 404 unknown, Verified/Archive per row, links to map + reverse page), /from index by country, public/sitemap.xml (2939 urls, written by data:build and committed by the monthly refresh), robots.txt. Origins with no destinations no longer produce route files (2936 pages).
- [x] 2026-08-22: Live on atlas at flights.miketineo.com via autonomous GitHub Actions CI/CD (tests gate → GHCR → SSH compose recreate).
- [x] 2026-08-22: CI fixed (13 template-residue test failures), auth-off invariant restored and baked into the image.
- [x] 2026-09: MapLibre v6 worker fix (blank map); observed-route union so weekly nonstops survive.
- [x] 2026-09-10: Framework retrofit (MISSION/SUCCESS/PLANNING/PLANE, thin CLAUDE.md).
- [x] 2026-09-11: CARTO courtesy tiles started watermarking API-KEY-REQUIRED (risk fired); emergency swap to OpenFreeMap dark shipped and verified live same day (28760bc): attribution added, CARTO raster fallback removed, land.geojson remains the error fallback.
- [x] 2026-09-11: flydirectfrom.com bought by Miguel (Cloudflare Registrar, zone on the personal account) and wired: apex + www CNAME -> atlas tunnel (proxied), cloudflared ingress -> 127.0.0.1:3080, new-zone hygiene applied (browser cache TTL respect-origin, Bot Fight Mode + JS detections off; crawler_protection endpoint 400s on this zone, HTML verified free of cdn-cgi injections). Both hostnames serve the app; old flights.miketineo.com untouched until the copy rename + canonical/301.
- [x] 2026-09-10: AeroDataBox decision executed on the FREE plan (Miguel's call: 400 units / 1600 requests per ~30 days). Overlay integration shipped: `scripts/fetch-aerodatabox.ts` (adaptive quota budgeting from live headers) → `data/observed/operated-routes.json` → merge in `build-openflights.ts` via `src/lib/flights/overlay.ts` (observed origins replace baseline, long tail stays OpenFlights). Monthly `data-refresh.yml` + `workflow_run` chaining into deploy. Canary CAG→DUB (Ryanair, avgDaily 0.43) verified on the free key before integration.
