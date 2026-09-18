# Basemap: self-hosted PMTiles on atlas

Since 2026-09-19 the map background is served from our own box, not a third-party tile server.
One archive, one bucket, one hostname.

| Piece | Where |
|---|---|
| Archive | `world-z10.pmtiles`, Protomaps planet build `20260917`, zoom 0 to 10, 3.75 GB |
| Storage | MinIO, stack `/opt/atlas/stacks/tiles/compose.yaml` on atlas (mirrored in the atlas repo), data in `/opt/atlas/data/tiles`, bucket `tiles` with anonymous read |
| Hostname | `https://tiles.flydirectfrom.com` → tunnel ingress → `127.0.0.1:9000` (Cloudflare proxied, CORS `*`) |
| Assets | `tiles/assets/sprites/v4/dark*` and `tiles/assets/fonts/Noto Sans {Regular,Medium,Italic}` from `protomaps/basemaps-assets` |
| Style | built in `src/components/explorer/FlightMap.tsx` from `@protomaps/basemaps` dark flavor with the site's background and land colours; tiles read through the `pmtiles://` protocol (HTTP range requests) |
| Fallback | `public/data/land.geojson` outlines if the style fails to load (unchanged) |

Zoom 10 is the archive's ceiling; MapLibre overzooms beyond it, so the map shows no street detail
when zoomed close. The explorer's `fitBounds` caps at zoom 5, which is all the product needs.

## Refresh (a few minutes, no downtime)

Run on atlas. Pick the newest daily build from `https://build.protomaps.com/YYYYMMDD.pmtiles`.

```
cd ~/tiles   # holds the pmtiles CLI (go-pmtiles 1.31.2)
./pmtiles extract https://build.protomaps.com/20261001.pmtiles world-z10.pmtiles --maxzoom=10
PW=$(sudo grep MINIO_ROOT_PASSWORD /opt/atlas/stacks/tiles/.env | cut -d= -f2)
docker run --rm --network host -v /home/miguel/tiles:/src:ro --entrypoint sh minio/minio -c "
  mc alias set local http://127.0.0.1:9000 tiles-admin $PW &&
  mc cp /src/world-z10.pmtiles local/tiles/world-z10.pmtiles"
rm world-z10.pmtiles
```

The archive never enters git. The pmtiles client reads the header on first load, so a swapped file
is picked up by new sessions immediately; open sessions keep their cached header until reload.

## Verify

```
curl -s -o /dev/null -D - -r 0-16383 https://tiles.flydirectfrom.com/tiles/world-z10.pmtiles | grep -iE '^HTTP|content-range'
# HTTP/2 206, Content-Range: bytes 0-16383/<size>
```

## Why not R2, S3 or GCS

R2 needs dashboard enablement on the account. The AWS and GCP free tiers cap GET requests at 20k
and 50k a month, and a map session issues dozens of range requests, so tile traffic would bill within
days. MinIO on atlas has no request ceiling, the box already fronts everything through the tunnel,
and the S3 API stays available for other projects.
