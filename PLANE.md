# PLANE.md

project: direct-flights
status: active
owner: miguel
repo: ~/hack/miketineo/the-audacity/projects/direct-flights

## About

A dark nonstop-route explorer. Search any airport, see every direct destination as animated great-circle arcs, and read airline, distance, and estimated duration in a sidebar (bottom sheet on mobile). First site of The Audacity's ad-funded free-sites portfolio (see MISSION.md). Roadmap single-source: this file; PLANNING.md carries decisions and session log only.

## Now

- [ ] Decide the ad positioning: the tagline says "ad-free" and AdSense contradicts it. Options: reposition ("fast, free, no clutter") or stay ad-free and drop AdSense for this site. Owner: Miguel. Leaning: reposition; the promise worth keeping is "no clutter, loads fast", not "zero ads".
- [ ] Privacy policy page (`/privacy`), linked from the footer. Required for AdSense approval and EU compliance regardless of positioning.
- [ ] Per-airport crawlable pages + `sitemap.xml` from the existing `public/data/routes/*.json` (real text content per airport: destinations, airlines, distances). This is both the SEO play and the "content depth" AdSense approval wants; a map-only SPA risks a thin-content rejection.

## Next

- [ ] Miguel creates/verifies the AdSense account and adds flights.miketineo.com → yields the `ca-pub-…` publisher id. HUMAN GATE: only Miguel can do this.
- [ ] Wire monetization once the pub id exists: `public/ads.txt`, the `adsbygoogle` script, 1-2 conservative ad slots (sidebar/bottom-sheet edge, never over the map), and a Google-certified CMP for EEA consent (Consent Mode v2).
- [ ] Google Search Console: verify the property, submit the sitemap.

## Later

- [ ] Portfolio site #2 using the same runbook + framework (pick the niche after direct-flights shows impressions).
- [ ] OpenFlights data refresh automation (`npm run data:build` on a schedule instead of manual rebuilds).
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
