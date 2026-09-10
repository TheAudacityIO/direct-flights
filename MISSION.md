# Mission: direct-flights

Owner: Miguel · Started: 2026-08-22 (framework retrofit 2026-09-10) · Status: active

## Why this exists

Answering "where can I fly nonstop from this airport" on airline and OTA sites is miserable: booking funnels, trackers, no map, no overview. direct-flights answers it in one view. For The Audacity, this is also the pilot of a portfolio bet: small, free, genuinely useful websites that pay for themselves with display ads. This repo proves the loop (build → autonomous deploy → traffic → AdSense revenue) is cheap enough to repeat before we build the second site.

## What we're building

- A fast map explorer of nonstop routes (OpenFlights data, MapLibre arcs, per-airport sidebar), live at flights.miketineo.com.
- Crawlable per-airport pages + sitemap, so search engines can send the traffic that makes ads worth anything.
- Ad placements light enough that the site stays pleasant; compliance first (consent, privacy) because the operator is EU-based.
- The repeatable playbook (deploy runbook + this framework) for portfolio site #2.

## Who it's for

- Travelers and trip planners asking "where can I go nonstop from X".
- Aviation-curious people who like route maps.
- The Audacity, as the first cell of an ad-funded free-sites portfolio.

## Non-goals (proposed 2026-09-10)

- Not an OTA: no prices, no booking, no affiliate funnels in v1.
- No user accounts: auth ships OFF and stays off until a feature genuinely needs it.
- No paid tier or subscription; monetization is display ads only.
- No realtime flight tracking; scope is the static OpenFlights route graph, refreshed periodically.

## Constraints

- Runs as one container on atlas (loopback 3080 behind cloudflared); keep infra at the free/flat tier.
- EU operator: personalized ads in the EEA require a Google-certified CMP and a privacy policy BEFORE the first ad unit ships.
- Public repo: nothing internal beyond what `.github/workflows/deploy.yml` already shows.
- The product keeps its own dark visual identity (Grok-era brand). Do not restyle it to the Audacity monochrome palette.
- Roadmap single-source: `PLANE.md`. Deploy pattern: the atlas runbook (see `AGENTS.md`).
