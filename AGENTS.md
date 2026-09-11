# direct-flights: agent brief

For any coding assistant working in this repo (Grok, Claude Code, Cursor, Codex, Gemini).

## What this is

FlyDirectFrom (flydirectfrom.com): dark, fast, free nonstop flight explorer, no clutter. OpenFlights baseline + AeroDataBox overlay on a MapLibre map. TanStack Start + React, Nitro node-server build, static route data under `public/data/`. Originally scaffolded on the Grok app platform; now GitHub-hosted and self-deployed.

The OpenFlights dump has no dates and misses modern LCC pairs; it is the BASELINE only. Current routes for the busiest origins come from an AeroDataBox overlay (see Data pipeline below). Do not scrape airline sites.

## Data pipeline (baseline + overlay)

- Baseline: OpenFlights dumps → `scripts/build-openflights.ts` → `public/data/`.
- Overlay: `scripts/fetch-aerodatabox.ts` fetches AeroDataBox daily-route stats per origin and writes the committed `data/observed/operated-routes.json` (includes quota telemetry); the build merges it via `src/lib/flights/overlay.ts` + `observed.ts`. Observed origins replace the baseline; the long tail stays OpenFlights.
- Endpoint: `GET https://aerodatabox.p.rapidapi.com/airports/iata/{code}/stats/routes/daily`. The `/flights/...` path variant 404s: do not "fix" the path.
- FREE plan budget: 400 API units / 1600 requests per ~30 days. The fetch script reads live quota headers and stops at its floors (`ADB_UNIT_FLOOR`, default 100); never loop it manually.
- Refresh: `.github/workflows/data-refresh.yml`, monthly + manual dispatch. Its push uses `GITHUB_TOKEN` (which triggers no push workflows), so `deploy.yml` chains off it via `workflow_run`.
- Key location: GitHub Actions secret `AERODATABOX_API_KEY` on this repo; locally, export env `AERODATABOX_API_KEY`. Never paste the key into code, docs, or logs. Vault mirror at `secret/projects/direct-flights` is PENDING: the atlas AppRole policy cannot write that path and extending Vault policy is ask-first, so the mirror waits for Miguel's next OIDC `vault login`.

Framework docs: `MISSION.md` (why + non-goals), `SUCCESS.md` (definition of done, verifiable), `PLANE.md` (roadmap single-source), `PLANNING.md` (decisions + retro). Read MISSION.md before proposing scope changes; update PLANE.md when you finish or queue work.

## Conventions

- Every commit message ends with `Actor:` and `Via:` trailers identifying who drove and through what (e.g. `Actor: miguel`, `Via: grok+code-fast-1` or `Via: cc+claude-fable-5`).
- Markdown-only pushes do not deploy (`deploy.yml` ignores `**.md`); code pushes to `main` ship to the live site.

## Commands (node 22)

- Install: `npm ci`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Dev server: `npm run dev`
- Production build: `npm run build` (Nitro `node-server` preset)

## Deploy (atlas, via GitHub Actions)

- `.github/workflows/ci.yml`: tests + typecheck + build on every PR and push to `main`.
- `.github/workflows/deploy.yml`: push to `main` (or manual dispatch with an image tag) runs the same checks, builds `ghcr.io/theaudacityio/direct-flights`, then over SSH pulls it on the atlas box and runs `docker compose up -d` in `/home/miguel/direct-flights/deploy`. The compose service binds `127.0.0.1:3080`; cloudflared ingress serves it publicly as `https://flydirectfrom.com` (canonical). `www.flydirectfrom.com` and the legacy `flights.miketineo.com` 301 to the canonical host via `server/middleware/host-redirect.ts`.
- SSH uses the write-only repo secrets `ATLAS_HOST`, `ATLAS_USER`, `ATLAS_SSH_KEY`. Re-provision them with the `copy-atlas-secrets.yml` workflow in `TheAudacityIO/bloop`.
- Verify a deploy by the workflow's last step output (`docker compose ps` + the HTTP code), not by the job merely finishing.
- Canonical playbook for this deploy pattern: the atlas infra repo, `docs/runbooks/deploy-app-from-github.md` (local checkout: `~/hack/miketineo/the-audacity/atlas`).

## Grok-platform residue (read before "fixing")

- `.grok/app-env.json` is tracked and ships `VITE_AUTH_ENABLED=false`: the deployed build has auth OFF (no `DATABASE_URL`, no OAuth backing). The Dockerfile sets the same flag explicitly because `.dockerignore` excludes `.grok`. Turning auth on means providing a Postgres `DATABASE_URL` plus Better Auth config, not just flipping the flag.
- `public/__grok/` holds the PWA icon and install-page stylesheet the head-injector references. The install page's decorative artwork was never exported from the Grok platform; the stylesheet hides it.
- `scripts/grok-pwa-*.mjs` tests are hermetic (they pass an empty `cwd`); the app's real identity lives in `src/lib/og/site.json` and `public/og.jpg`.
