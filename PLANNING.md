# Planning: direct-flights

Living document. Update at the start and end of every working session. Newest decisions at top of the decision log.

## Current phase

Monetization-ready: from "live map" to "compliant, indexable, ad-serving site". Exit: the unchecked criteria in SUCCESS.md § Definition of done are all checked.

## Now / Next / Later

Roadmap single-source is `PLANE.md` (PLANE.md trial standard, 2026-09-07). Do not duplicate items here; this file carries phase, decisions, and retro only.

## Open decisions

| Decision | Options | Leaning | Who decides |
|---|---|---|---|
| Ad positioning vs "ad-free" tagline | reposition ("fast, free, no clutter") vs stay ad-free (no AdSense here) | reposition; the defensible promise is "no clutter", and the portfolio thesis needs the revenue loop proven | Miguel |
| CMP for EEA consent | Google-certified CMP options (e.g. Funding Choices / a TCF-registered CMP) | Funding Choices: free, native AdSense integration | advisor model |
| Affiliate links (flights/hotels) later | none v1 vs add after traffic | none v1 (non-goal); revisit only with real traffic | Miguel |

## Decision log

- 2026-09-10: Framework retrofit; PLANE.md (already scaffolded by the discovery script) becomes the roadmap single-source; monetization mission recorded (AdSense pilot for the free-sites portfolio).
- 2026-08-22: Repo adapted to the atlas deploy pattern (tests gate → GHCR → SSH); auth ships OFF; registered in the workspace indexes and allowlist.
- 2026-08-22 (Grok era): app built on the Grok platform, exported to GitHub with the workspace state (.grok, __grok assets) initially missing.

## Retro notes (feed the feedback loop)

- Worked: image-only deploys (no source on the box) survived three weeks of pushes without drift.
- Failed/retried: Grok-platform gitignore hid required files; fixed by tracking `.grok/app-env.json` + `public/__grok`.
- Rule/template/skill to update: fold PLANE.md into the project-bootstrap skill once the trial is validated → applied at: pending (global skill).
