# PLANE.md

project: direct-flights
status: active
owner: miguel
repo: ~/hack/miketineo/the-audacity/projects/direct-flights

## About

A dark nonstop-route explorer. Search any airport, see every direct destination as animated great-circle arcs, and read airline, distance, and estimated duration in a sidebar (bottom sheet on mobile). First site of The Audacity's ad-funded free-sites portfolio (see MISSION.md). Roadmap single-source: this file; PLANNING.md carries decisions and session log only.

## Now

Resume queue for a fresh session; work top to bottom. State below is accurate as of 2026-09-11 (commit 28760bc on main).

1. [ ] Basemap durable fix (Protomaps, self-hosted). Miguel rejected keyed SaaS on cost; direction: low-zoom planet extract (z0-10) in Cloudflare R2 on the personal account, served by the official PMTiles Cloudflare Worker (repo protomaps/PMTiles, serverless/cloudflare) on tiles.flydirectfrom.com, dark flavor via @protomaps/basemaps, Protomaps/OSM attribution. BLOCKED: R2 is not enabled on the account (wrangler error code 10042, dashboard-only enablement; needs Miguel or a console session). Recipe once enabled: `pmtiles extract https://build.protomaps.com/<latest>.pmtiles world-z10.pmtiles --maxzoom=10` (pmtiles CLI is in Homebrew; file is a few GB and NEVER enters git), bucket `flydirectfrom-tiles`, deploy the worker, then point FlightMap's primary style at it. Fallback if R2 keeps fighting: static range-request serving of the .pmtiles from atlas behind the tunnel. Current serving state: OpenFreeMap public dark style (keyless, donation-backed, no SLA) with the bundled land.geojson as error fallback; CARTO is gone (its courtesy tiles started watermarking API-KEY-REQUIRED on 2026-09-11).
2. [ ] Defunct-carrier purge + provenance badges. Curate `src/lib/flights/defunct.ts`: majors whose operations ceased since the ~2014 dump (Alitalia, Air Berlin, Niki, Meridiana/Air Italy, Blue Panorama, Excel Airways/XL Airways, Monarch, Thomas Cook, Flybe, Jet Airways, WOW air, Transaero, Germania, Norwegian Long Haul, Aigle Azur, Adria, Spanair, Kingfisher, Malev, Cimber Sterling, Estonian Air, Air Namibia, South African Express, Interjet, TAME, LIAT, Small Planet, Primera Air; bankruptcies only, NOT merged brands like US Airways/Virgin America). In `buildDataset`: strip defunct names from airline lists; drop a destination whose previously nonempty list becomes empty. Badge in DestinationList + RouteDetail: observed entries (have `lastSeen`) get a current/verified chip, baseline-only get an archive/unverified chip. Then `npm run data:build -- --force` and COMMIT the regenerated public/data so the live JSON changes (acceptance: FCO.json no longer contains CCS/Alitalia; CAG->DUB still present).
3. [ ] Hero copy: stop piping meta.note into the hero (Explorer.tsx line ~56 sets datasetNote from meta.note; drop it, keep the static fallback sentence). Make the meta note in build-openflights.ts user-facing and grammatical for 1 or N overlay airports.
4. [ ] Merge branch `wip/rename-flydirectfrom` (pushed; commit 78b86c5). Contains: FlyDirectFrom identity (og site.json, root head, Explorer strings), ad-free promise replaced, canonical links on / and /privacy, host-redirect middleware (301 www + flights.miketineo.com -> https://flydirectfrom.com), privacy page, hero footer links. Gates were green at commit BUT: (a) rebase onto current main first, (b) the redirect middleware has had NO runtime smoke; boot the built server locally and curl with spoofed Host headers before shipping, (c) update the privacy page's basemap paragraph (it says CARTO; serving stack is now OpenFreeMap, later Protomaps).
5. [ ] Per-airport SEO pages + sitemap.xml + robots.txt. SSR routes reading public/data via a small fs util (dev: public/data, prod: .output/public/data), honest data labels from meta.json (baseline vs observed markers; overlay covers ONLY CAG until the ~Oct 5 quota reset), links between map and pages. This closes the AdSense-application prerequisites together with the privacy page.
6. [ ] Ads wiring: waits for Miguel's AdSense `ca-pub` id and data-tier/timing answers; then ads.txt, adsbygoogle, certified CMP (Consent Mode v2), rewarded-unlock loop per the Next section.

## Next

- [ ] Miguel creates/verifies the AdSense account and adds the new domain → yields the `ca-pub-…` publisher id. HUMAN GATE: only Miguel can do this.
- [ ] Wire monetization once the pub id exists: `public/ads.txt`, the `adsbygoogle` script, 1-2 conservative display slots (sidebar/bottom-sheet edge, never over the map), and a Google-certified CMP for EEA consent (Consent Mode v2).
- [ ] Rewarded-unlock loop (the FlightConnections-Premium counter): gate heavier features (date/time filters, schedule depth) behind a Google Ad Manager "rewarded ads for web" unit. Policy bounds: reward is granted after a 5s in-view ad, must be non-monetary and redeemable on-site only; interstitials only as between-navigation vignettes, NEVER popups on first load (intrusive-interstitial penalty + AdSense policy).
- [ ] Google Search Console: verify the property, submit the sitemap.
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

- [x] 2026-08-22: Live on atlas at flights.miketineo.com via autonomous GitHub Actions CI/CD (tests gate → GHCR → SSH compose recreate).
- [x] 2026-08-22: CI fixed (13 template-residue test failures), auth-off invariant restored and baked into the image.
- [x] 2026-09: MapLibre v6 worker fix (blank map); observed-route union so weekly nonstops survive.
- [x] 2026-09-10: Framework retrofit (MISSION/SUCCESS/PLANNING/PLANE, thin CLAUDE.md).
- [x] 2026-09-11: CARTO courtesy tiles started watermarking API-KEY-REQUIRED (risk fired); emergency swap to OpenFreeMap dark shipped and verified live same day (28760bc): attribution added, CARTO raster fallback removed, land.geojson remains the error fallback.
- [x] 2026-09-11: flydirectfrom.com bought by Miguel (Cloudflare Registrar, zone on the personal account) and wired: apex + www CNAME -> atlas tunnel (proxied), cloudflared ingress -> 127.0.0.1:3080, new-zone hygiene applied (browser cache TTL respect-origin, Bot Fight Mode + JS detections off; crawler_protection endpoint 400s on this zone, HTML verified free of cdn-cgi injections). Both hostnames serve the app; old flights.miketineo.com untouched until the copy rename + canonical/301.
- [x] 2026-09-10: AeroDataBox decision executed on the FREE plan (Miguel's call: 400 units / 1600 requests per ~30 days). Overlay integration shipped: `scripts/fetch-aerodatabox.ts` (adaptive quota budgeting from live headers) → `data/observed/operated-routes.json` → merge in `build-openflights.ts` via `src/lib/flights/overlay.ts` (observed origins replace baseline, long tail stays OpenFlights). Monthly `data-refresh.yml` + `workflow_run` chaining into deploy. Canary CAG→DUB (Ryanair, avgDaily 0.43) verified on the free key before integration.
