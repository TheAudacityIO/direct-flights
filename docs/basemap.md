# Basemap: self-hosted PMTiles on atlas

Since 2026-09-19 the map background is served from our own box, not a third-party tile server.
One archive, one directory, one hostname.

| Piece | Where |
|---|---|
| Archive | `world-z10.pmtiles`, Protomaps planet build `20260917`, zoom 0 to 10, 3.75 GB |
| Storage | Plain files served read-only by nginx (image pinned by tag and digest), stack `/opt/atlas/stacks/tiles/compose.yaml` on atlas (mirrored in the atlas repo, with `nginx.conf` next to it). Files live in `/opt/atlas/data/tiles-static/tiles/`, so URL `/tiles/<path>` is file `tiles-static/tiles/<path>`. Replaced MinIO on 2026-09-27; the MinIO definition sits in `stacks/tiles/minio-retired/` as the rollback path |
| Access | GET/HEAD/OPTIONS only, no directory listing, no writes. HTTP range requests on (the pmtiles client needs them) |
| Hostname | `https://tiles.flydirectfrom.com` → tunnel ingress → `127.0.0.1:9000` (Cloudflare proxied) |
| CORS | exactly `https://flydirectfrom.com`, `https://www.flydirectfrom.com`, `https://flights.miketineo.com`; no wildcard, no credentials. Add an origin in `stacks/tiles/nginx.conf` (the `map $http_origin` block) before serving the map from a new hostname or from local dev |
| Cache | `Cache-Control: public, max-age=86400` on `.pmtiles`, `public, max-age=604800` on sprites and fonts (`/tiles/assets/`) |
| Assets | `tiles/assets/sprites/v4/dark*` and `tiles/assets/fonts/Noto Sans {Regular,Medium,Italic}` from `protomaps/basemaps-assets` |
| Style | built in `src/components/explorer/FlightMap.tsx` from `@protomaps/basemaps` dark flavor with the site's background and land colours; tiles read through the `pmtiles://` protocol (HTTP range requests) |
| Fallback | `public/data/land.geojson` outlines if the style fails to load (unchanged) |

Zoom 10 is the archive's ceiling; MapLibre overzooms beyond it, so the map shows no street detail
when zoomed close. The explorer's `fitBounds` caps at zoom 5, which is all the product needs.

## Refresh (a few minutes, no downtime)

Run on atlas. Pick the newest daily build from `https://build.protomaps.com/YYYYMMDD.pmtiles`.
Extract into a staging dir on the same filesystem as the served file, then `mv` it over the old
one: a rename is atomic, so nginx serves either the whole old archive or the whole new one, never
a half-written file. `.incoming/` sits outside `/tiles/`, so nginx never serves it.

```
S=/opt/atlas/data/tiles-static
sudo mkdir -p $S/.incoming
sudo ~/tiles/pmtiles extract https://build.protomaps.com/20261001.pmtiles $S/.incoming/world-z10.pmtiles --maxzoom=10   # go-pmtiles 1.31.2
~/tiles/pmtiles show $S/.incoming/world-z10.pmtiles | head          # sanity: header, maxzoom 10
sudo chmod 644 $S/.incoming/world-z10.pmtiles
sudo mv $S/.incoming/world-z10.pmtiles $S/tiles/world-z10.pmtiles
```

No restart needed. Sprites and fonts are refreshed the same way: write the new files under
`$S/.incoming/`, then `mv` them into `$S/tiles/assets/`.

The archive never enters git. The pmtiles client reads the header on first load and checks the
ETag (nginx derives it from mtime and size), so new sessions pick up a swapped file immediately;
open sessions keep their cached header until reload. Cloudflare does not cache the range requests
for the archive, but it does cache sprites and fonts for up to 7 days: purge those URLs in the
dashboard after replacing them.

## Verify

```
curl -s -o /dev/null -D - -r 0-16383 https://tiles.flydirectfrom.com/tiles/world-z10.pmtiles | grep -iE '^HTTP|content-range'
# HTTP/2 206, Content-Range: bytes 0-16383/<size>
```

## Why not R2, S3 or GCS

R2 needs dashboard enablement on the account. The AWS and GCP free tiers cap GET requests at 20k
and 50k a month, and a map session issues dozens of range requests, so tile traffic would bill within
days. Serving from atlas has no request ceiling, and the box already fronts everything through the
tunnel. MinIO was the first version (2026-09-19 to 2026-09-27); plain nginx replaced it because the
map only ever needed static files with range support, and a static server has no admin API,
credentials or bucket policy to get wrong.
