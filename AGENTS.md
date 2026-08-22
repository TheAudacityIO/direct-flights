# direct-flights: agent brief

For any coding assistant working in this repo (Grok, Claude Code, Cursor, Codex, Gemini).

## What this is

Dark, ad-free nonstop flight explorer: OpenFlights data on a MapLibre map. TanStack Start + React, Nitro node-server build, static route data under `public/data/`. Originally scaffolded on the Grok app platform; now GitHub-hosted and self-deployed.

## Commands (node 22)

- Install: `npm ci`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Dev server: `npm run dev`
- Production build: `npm run build` (Nitro `node-server` preset)

## Deploy (atlas, via GitHub Actions)

- `.github/workflows/ci.yml`: tests + typecheck + build on every PR and push to `main`.
- `.github/workflows/deploy.yml`: push to `main` (or manual dispatch with an image tag) runs the same checks, builds `ghcr.io/theaudacityio/direct-flights`, then over SSH pulls it on the atlas box and runs `docker compose up -d` in `/home/miguel/direct-flights/deploy`. The compose service binds `127.0.0.1:3080`; cloudflared ingress serves it publicly as `https://flights.miketineo.com`.
- SSH uses the write-only repo secrets `ATLAS_HOST`, `ATLAS_USER`, `ATLAS_SSH_KEY`. Re-provision them with the `copy-atlas-secrets.yml` workflow in `TheAudacityIO/bloop`.
- Verify a deploy by the workflow's last step output (`docker compose ps` + the HTTP code), not by the job merely finishing.
- Canonical playbook for this deploy pattern: the atlas infra repo, `docs/runbooks/deploy-app-from-github.md` (local checkout: `~/hack/miketineo/the-audacity/atlas`).

## Grok-platform residue (read before "fixing")

- `.grok/app-env.json` is tracked and ships `VITE_AUTH_ENABLED=false`: the deployed build has auth OFF (no `DATABASE_URL`, no OAuth backing). The Dockerfile sets the same flag explicitly because `.dockerignore` excludes `.grok`. Turning auth on means providing a Postgres `DATABASE_URL` plus Better Auth config, not just flipping the flag.
- `public/__grok/` holds the PWA icon and install-page stylesheet the head-injector references. The install page's decorative artwork was never exported from the Grok platform; the stylesheet hides it.
- `scripts/grok-pwa-*.mjs` tests are hermetic (they pass an empty `cwd`); the app's real identity lives in `src/lib/og/site.json` and `public/og.jpg`.
