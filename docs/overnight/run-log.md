# Overnight run log: 2026-09-18

Branch `overnight/seo-monetisation` off `origin/main` `da868ec`, worktree
`~/hack/miketineo/the-audacity/projects/direct-flights-overnight` on atlas. Toolchain: node 22 via
`node:22-alpine` container (no native node on atlas). All changes are committed locally on the
branch and not pushed (see `blocked.md` B1).

## Phase 1: audit

- Read AGENTS.md, MISSION.md, SUCCESS.md, PLANE.md, PLANNING.md from `origin/main` (the local
  checkout's `main` was 20+ commits behind and its working tree carries Miguel's uncommitted v2
  design, so a separate worktree was used).
- Probed the live site and the box: `docs/overnight/audit.md`.
- Baseline gates: tests 69 pass, typecheck clean, lint 1 error + 1 warning.

## Phase 2: SEO

| Change | Files | Why |
|---|---|---|
| JSON-LD helpers: `jsonLdScript`, `breadcrumbJsonLd`, `airportCrumbs`, `countryCrumbs`, `airportPageJsonLd`, `websiteJsonLd` | `src/lib/flights/seo.ts` | PLANE.md Now #5b. Pure, testable, `<` escaped so route data can never close the script tag |
| Tests for the above (4 cases) | `src/lib/flights/seo.test.ts` | keep `npm test` as the gate |
| BreadcrumbList + WebPage/Airport on airport pages | `src/routes/from.$iata.tsx` | rich breadcrumbs in results, `iataCode` as the entity key |
| BreadcrumbList on country pages | `src/routes/countries.$slug.tsx` | same |
| WebSite node on the home page | `src/routes/index.tsx` | `isPartOf` target for the airport pages, names The Audacity as publisher |

Verified by a production build in the container and curling the node-server: `/`, `/from/FCO`,
`/countries/italy` each carry the expected `<script type="application/ld+json">` in the head;
`/from` and `/privacy` unchanged.

Sitemap and airport pages themselves were already shipped on `main` (d476d4e, e55835b); nothing
to redo. The live sitemap serves 3162 URLs.

## Phase 3: privacy, consent, AdSense

| Change | Files | Why |
|---|---|---|
| `ARG VITE_ADSENSE_SLOT_AIRPORT/_COUNTRY/_SIDEBAR`, `ARG VITE_REWARDED_AD_UNIT` (empty defaults) | `Dockerfile` | PLANE.md Now #4c asked for this; empty keeps the reserved placeholders |
| `build-args` from repository variables | `.github/workflows/deploy.yml` | unit ids are public, so variables not secrets; unset = unchanged build |
| Consent, CMP and placement plan | `docs/overnight/monetisation.md` | ready-to-run console steps and verify commands |

Privacy page, ads.txt and the AdSense loader were already live; verified, not changed.

## Phase 4: quality gates and housekeeping

| Change | Files | Why |
|---|---|---|
| Empty catch block given a comment | `src/lib/app-data/client.server.ts` | the one lint error (Grok-template residue) |
| Unused `eslint-disable` removed | `src/lib/auth/use-current-user.ts` | the one lint warning |
| `npm run lint` added to CI | `.github/workflows/ci.yml` | SUCCESS.md lists lint as a gate; CI never ran it |
| Sitemap and privacy criteria checked, verify URLs moved to flydirectfrom.com | `SUCCESS.md` | the verify commands pass live |
| Now #4c and #5b/#5c updated, Done entry added | `PLANE.md` | roadmap single-source stays accurate |

Final gates on the branch: `npm test` 73 pass (plus the 135 script-level tests), `npm run typecheck`
clean, `npm run lint` clean, production build succeeds.

Secrets check: `git diff origin/main` grepped for `KEY`, `SECRET`, `TOKEN`, `.env`, `credentials`;
the only hits are the documented `VITE_*` build-arg names and the `gh variable set` examples with
placeholder values.

## Not done, and why

- Search Console, AdSense review, GDPR message, Ad Manager unit: human gates (`blocked.md` B2 to B4).
- Trailing-slash 301 and map-page payload: routing and performance work with blast radius beyond
  an unattended run (`blocked.md` B5, B6).
- Per-origin sitemap `lastmod`: belongs in the data build, changes a committed artefact monthly.
- No AeroDataBox call was made; the data pipeline was not touched.

## 2026-09-19: basemap ownership (PLANE.md Now #1), gates removed by Miguel

Miguel's direction: no human gates for this exercise; AdSense console steps were already done on
his side (review "getting ready"); storage preference MinIO on atlas over R2/S3/GCS.

| Change | Where | Why |
|---|---|---|
| `tiles` stack: MinIO, loopback 9000, bucket `tiles` anonymous read, CORS `*` | `/opt/atlas/stacks/tiles/` on the box, mirrored to the atlas repo `stacks/tiles/` (uncommitted there; that repo carries unrelated dirty state) | PMTiles only needs HTTP range reads; no request caps, no third-party key |
| Planet extract z0-10 (Protomaps build 20260917, 3.75 GB) + sprites + Noto fonts uploaded | MinIO bucket | one archive covers the product's zoom range (fitBounds caps at 5) |
| Tunnel ingress + proxied CNAME `tiles.flydirectfrom.com` | Cloudflare personal account (backup of the previous tunnel config in the job tmp dir) | public origin for the browser |
| Cloudflare cache rule for `/tiles/assets/*` | zone ruleset | fonts and sprites cached at the edge; the archive itself is above the free-plan cache size and is served by MinIO directly |
| `pmtiles` + `@protomaps/basemaps` deps; style built from the dark flavor with the site palette; `pmtiles://` protocol | `src/components/explorer/FlightMap.tsx`, `package.json` | replaces the OpenFreeMap style URL; land.geojson fallback kept |
| Preconnect and privacy text updated | `src/routes/__root.tsx`, `src/routes/privacy.tsx` | no third-party tile provider sees requests any more |
| Refresh recipe | `docs/basemap.md` | monthly-ish re-extract is one command |

Verification: tests 73 + 135 pass (three consecutive runs), typecheck and lint clean, production build
OK; headless Chromium against the built server loaded `/?from=FCO` with 23 requests to
tiles.flydirectfrom.com, attribution "Protomaps © OpenStreetMap", zero console or HTTP errors,
screenshot reviewed (dark basemap, labels, arcs). EU-IP check on the live site shows the Google
consent-message endpoint already loading, so the GDPR message is published.
