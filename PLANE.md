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
- [ ] Data upgrade (data-source assessment 2026-09-10): the OpenFlights dump is ~2014-stale and the observed-route union (`src/lib/flights/observed.ts`) is wired but UNFED. Fix: Amadeus Self-Service "Airport Routes" key → Vault `secret/projects/direct-flights` + repo secret, overlay in `build-openflights.ts`, weekly CI rebuild (~3,000 calls/refresh, single-digit euros). HUMAN GATE: Miguel signs up at developers.amadeus.com (test key instant; production key needs billing details; Airport Routes has NO product review, provisioning only, 1-3 business days). Handoff contract: store as `vault kv put secret/projects/direct-flights amadeus_api_key=… amadeus_api_secret=…`; the integration reads exactly those field names, test and production pairs share the path. Test-env data is a limited cache: treat test-key output as plumbing validation only; the CAG–DUB Ryanair canary passes only on the production key. ⚠ Prerequisite for the rewarded premium features (date/schedule depth needs dated data; OAG/Cirium stay revenue-gated).

## Later

- [ ] Portfolio site #2 using the same runbook + framework (pick the niche after direct-flights shows impressions).
- [ ] Ad-slot/layout tuning once there is traffic data worth reading.
- [ ] Lightweight analytics (PostHog free tier) if AdSense reporting alone proves too coarse.

## Backlog

- [ ] Auth-on decision: only if a feature needs accounts (requires `DATABASE_URL` + Better Auth config on atlas; flag alone is not enough).
- [ ] PWA install-page artwork (Grok platform never exported it; stylesheet currently hides the gap).

## Done

- [x] 2026-08-22: Live on atlas at flights.miketineo.com via autonomous GitHub Actions CI/CD (tests gate → GHCR → SSH compose recreate).
- [x] 2026-08-22: CI fixed (13 template-residue test failures), auth-off invariant restored and baked into the image.
- [x] 2026-09: MapLibre v6 worker fix (blank map); observed-route union so weekly nonstops survive.
- [x] 2026-09-10: Framework retrofit (MISSION/SUCCESS/PLANNING/PLANE, thin CLAUDE.md).
