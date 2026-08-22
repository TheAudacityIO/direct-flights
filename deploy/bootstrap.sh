#!/usr/bin/env bash
# Run once on the VPS (with Docker already installed).
# Usage: sudo DOMAIN=flights.example.com ./deploy/bootstrap.sh
set -euo pipefail

DEST="${DEPLOY_PATH:-/opt/direct-flights}"
IMAGE="${IMAGE:-ghcr.io/theaudacityio/direct-flights:latest}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Engine, then re-run." >&2
  exit 1
fi

mkdir -p "$DEST"
cp "$(dirname "$0")/docker-compose.yml" "$DEST/docker-compose.yml"
if [[ -f "$(dirname "$0")/Caddyfile" ]]; then
  cp "$(dirname "$0")/Caddyfile" "$DEST/Caddyfile"
fi

cd "$DEST"
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-theaudacityio}" --password-stdin
fi

export TAG="${TAG:-latest}"
docker compose pull
docker compose up -d
echo "Direct Flights is up on 127.0.0.1:3080"
echo "Point $DOMAIN (or your reverse proxy) at that port. See docs/deploy.md"
