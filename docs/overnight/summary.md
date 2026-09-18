# Overnight run summary: 2026-09-18

Branch `overnight/seo-monetisation` (worktree `~/hack/miketineo/the-audacity/projects/direct-flights-overnight`
on atlas), committed locally, not pushed. Base: `origin/main` at `da868ec`.

## What was completed

- Audit of the repo and the live site (`audit.md`). Finding: airport pages, sitemap (3162 URLs),
  robots, privacy page, ads.txt and the AdSense loader were already shipped and are live; the run's
  real delta was smaller than the brief assumed.
- JSON-LD structured data (PLANE.md Now #5b): BreadcrumbList and a WebPage-about-Airport node on
  every `/from/{IATA}` page, BreadcrumbList on `/countries/{slug}`, WebSite on `/`. Pure helpers in
  `src/lib/flights/seo.ts` with tests; verified in the built server's HTML.
- Lint made green (one Grok-era empty catch, one stale eslint-disable) and `npm run lint` added to
  `ci.yml` so SUCCESS.md's quality gate is enforced.
- AdSense unit ids and the rewarded unit path wired as Dockerfile build args fed by repository
  variables in `deploy.yml`, empty by default (no behavior change until Miguel sets them).
- SUCCESS.md: sitemap and privacy criteria checked with live verification; verify URLs moved to
  flydirectfrom.com. PLANE.md updated (Now #4c, #5b, #5c; Done entry).
- Docs: `audit.md`, `monetisation.md` (CMP plan, go-live commands, placements), `blocked.md`,
  `run-log.md`, this file.

Gates on the final tree: 73 + 135 tests pass, typecheck clean, lint clean, production build OK.
No secrets in the diff. The data pipeline and AeroDataBox quota were not touched.

## What remains (code side)

- Merge the branch (B1). CI will run lint for the first time on a PR; it passes locally.
- Trailing-slash 307 to 301 (B5) and the map-page payload (B6): deliberate follow-ups.

## Blocked on Miguel

- B1: push/merge `overnight/seo-monetisation` (repo not on the auto-push allowlist).
- B2: Search Console verification + sitemap submission.
- B3: AdSense verify → request review → Auto ads → 3 unit ids as repo variables → GDPR message
  published → seller info transparent.
- B4: Ad Manager rewarded unit (optional).

Details and commands: `docs/overnight/blocked.md` and `docs/overnight/monetisation.md` § 2 and § 3.

## Update 2026-09-19

Miguel removed the human gates: AdSense console steps are done (review pending at Google), the branch merges on green CI, and the basemap moved to MinIO on atlas (PLANE.md Now #1 done, `docs/basemap.md`). Remaining human-only item: none in the loop. Optional: a Google service account for Search Console reads; otherwise Cloudflare analytics is the traffic metric.
