# PLANE.md

project: direct-flights
status: active
owner: miguel
repo: ~/hack/miketineo/the-audacity/projects/direct-flights

## About

A dark nonstop-route explorer. Search any airport, see every direct destination as animated great-circle arcs, and read airline, distance, and estimated duration in a sidebar (bottom sheet on mobile). First site of The Audacity's ad-funded free-sites portfolio (see MISSION.md). Roadmap single-source: this file; PLANNING.md carries decisions and session log only.

## Now

- [ ] Register the chosen domain (naming research 2026-09-10 in PLANNING.md; recommendation: flydirectfrom.com, $11/yr .com, verified available). HUMAN GATE: Miguel confirms name + registrar.
- [ ] Execute the rename once the domain exists: site copy drops "ad-free" (new promise: fast, free, no clutter), README/AGENTS/`src/lib/og/site.json` identity, cloudflared ingress + DNS for the new hostname, 301 from flights.miketineo.com, keep the old hostname serving through the transition.
- [ ] Privacy policy page (`/privacy`), linked from the footer. Required for AdSense approval and EU compliance.
- [ ] Per-airport crawlable pages + `sitemap.xml` from the existing `public/data/routes/*.json` (real text content per airport: destinations, airlines, distances). This is both the SEO play and the "content depth" AdSense approval wants; a map-only SPA risks a thin-content rejection.

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

- [ ] Basemap ownership before real traffic: today the map uses CARTO's free public Dark Matter raster tiles (no key, no SLA, courtesy tier that throttles commercial-scale referrers). Migrate to self-hosted Protomaps PMTiles (low-zoom planet extract served from our box, dark vector style, OSM attribution kept) BEFORE the AdSense launch drives volume. ~half a day. Rejected: OSM tile servers (policy-prohibited), Google (wrong stack + cost), Mapbox/MapTiler/Stadia (per-load or subscription against an RPM-thin ads business).
- [ ] Auth-on decision: only if a feature needs accounts (requires `DATABASE_URL` + Better Auth config on atlas; flag alone is not enough).
- [ ] PWA install-page artwork (Grok platform never exported it; stylesheet currently hides the gap).

## Done

- [x] 2026-08-22: Live on atlas at flights.miketineo.com via autonomous GitHub Actions CI/CD (tests gate → GHCR → SSH compose recreate).
- [x] 2026-08-22: CI fixed (13 template-residue test failures), auth-off invariant restored and baked into the image.
- [x] 2026-09: MapLibre v6 worker fix (blank map); observed-route union so weekly nonstops survive.
- [x] 2026-09-10: Framework retrofit (MISSION/SUCCESS/PLANNING/PLANE, thin CLAUDE.md).
- [x] 2026-09-10: AeroDataBox decision executed on the FREE plan (Miguel's call: 400 units / 1600 requests per ~30 days). Overlay integration shipped: `scripts/fetch-aerodatabox.ts` (adaptive quota budgeting from live headers) → `data/observed/operated-routes.json` → merge in `build-openflights.ts` via `src/lib/flights/overlay.ts` (observed origins replace baseline, long tail stays OpenFlights). Monthly `data-refresh.yml` + `workflow_run` chaining into deploy. Canary CAG→DUB (Ryanair, avgDaily 0.43) verified on the free key before integration.
