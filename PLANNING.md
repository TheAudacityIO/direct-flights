# Planning: direct-flights

Living document. Update at the start and end of every working session. Newest decisions at top of the decision log.

## Current phase

Monetization-ready: from "live map" to "compliant, indexable, ad-serving site". Exit: the unchecked criteria in SUCCESS.md § Definition of done are all checked.

## Now / Next / Later

Roadmap single-source is `PLANE.md` (PLANE.md trial standard, 2026-09-07). Do not duplicate items here; this file carries phase, decisions, and retro only.

## Open decisions

| Decision | Options | Leaning | Who decides |
|---|---|---|---|
| Domain + name | flydirectfrom.com ($11/yr, available, mirrors the query verbatim) vs from.flights ($31/$47 renew, distinctive hack, weak type-in) vs winghops.com (brandable, zero search intent) | flydirectfrom.com: the SEO-led play wants the name to BE the query stem | Miguel |
| CMP for EEA consent | Google-certified CMP options (e.g. Funding Choices / a TCF-registered CMP) | Funding Choices: free, native AdSense integration | advisor model |
| Affiliate links (flights/hotels) later | none v1 vs add after traffic | none v1 (non-goal); revisit only with real traffic | Miguel |

## Decision log

- 2026-09-10 (Miguel): AdSense confirmed; "ad-free" positioning dropped, new promise "clean and tidy, fast, free"; ad model = clean display + between-navigation vignettes + rewarded unlocks for premium-tier features (the free counter to FlightConnections Premium's paywall: date search, time filters, schedule depth). No on-load popups (policy + SEO penalty).
- 2026-09-10 naming research: demand phrasing splits by dialect — "direct flights from X" + "where can I fly direct from X" (UK/EU autocomplete) vs "nonstop flights from X" (US); both have per-airport long tails. Market is real and occupied: FlightConnections ~#12.4k global / #567 Air Travel / ~2.35M visits/mo scale, plus flightsfrom.com, and smaller direct rivals ALREADY on the obvious names (neverlayover.com = active price-alert competitor, nonstopfrom.com = active). Availability sweep: almost every intent-exact .com taken; available: flydirectfrom.com, nonstopsfrom.com (rejected: one letter from a competitor), skipthelayover.com, nonstopfinder.com, directflightmap.com, winghops.com, from.flights, whereto.flights. Recommendation: flydirectfrom.com; optional from.flights as vanity redirect.
- 2026-09-10: Rewarded ads verified feasible on web via Google Ad Manager ("rewarded ads for web", GPT; 5s in-view grants reward; rewards must be non-monetary + on-site only). Plain AdSense covers display + Auto Ads vignettes; the rewarded unit is the Ad Manager step.
- 2026-09-10: Framework retrofit; PLANE.md (already scaffolded by the discovery script) becomes the roadmap single-source; monetization mission recorded (AdSense pilot for the free-sites portfolio).
- 2026-08-22: Repo adapted to the atlas deploy pattern (tests gate → GHCR → SSH); auth ships OFF; registered in the workspace indexes and allowlist.
- 2026-08-22 (Grok era): app built on the Grok platform, exported to GitHub with the workspace state (.grok, __grok assets) initially missing.

## Retro notes (feed the feedback loop)

- Worked: image-only deploys (no source on the box) survived three weeks of pushes without drift.
- Failed/retried: Grok-platform gitignore hid required files; fixed by tracking `.grok/app-env.json` + `public/__grok`.
- Rule/template/skill to update: fold PLANE.md into the project-bootstrap skill once the trial is validated → applied at: pending (global skill).
