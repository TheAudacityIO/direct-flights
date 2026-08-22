# Deploy Direct Flights to a VPS

CI on every push: tests, typecheck, node-server build.
CD on `main`: Docker image → GitHub Container Registry → SSH pull on your box.

The app listens on **127.0.0.1:3080** so it sits behind whatever reverse proxy you already run (Caddy, nginx, Traefik).

## 1. One-time on the server

Docker Engine + Compose v2, then:

```bash
sudo mkdir -p /opt/direct-flights
```

Point a hostname at the box. Suggested: `flights.miketineo.com`.

If you use Caddy, drop in `deploy/Caddyfile` (or equivalent nginx `proxy_pass http://127.0.0.1:3080`).

## 2. GitHub secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Example |
| --- | --- |
| `SSH_HOST` | `203.0.113.10` or `vps.example.com` |
| `SSH_USER` | `deploy` |
| `SSH_KEY` | private key whose **public** half is in `~/.ssh/authorized_keys` on the box |
| `SSH_PORT` | `22` (optional) |
| `DEPLOY_PATH` | `/opt/direct-flights` (optional) |

Use a **deploy-only** key, not your laptop key. Restrict it with `command=` if you want.

The GitHub Actions token is passed over SSH only to `docker login ghcr.io`, so the box can pull the private/public package.

## 3. Ship it

Push to `main` or run **Actions → Deploy → Run workflow**.

First image publish may need the GHCR package set public (or the SSH login above, which already handles private):

```bash
gh api --method PUT -H "Accept: application/vnd.github+json" \
  /user/packages/container/direct-flights/visibility \
  -f visibility=public
```

## Local image (no CI)

```bash
NITRO_PRESET=node-server docker build -t direct-flights .
docker run --rm -p 3080:3000 direct-flights
```
