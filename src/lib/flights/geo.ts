const EARTH_RADIUS_KM = 6371;
const CRUISE_KMH = 850;
const TAXI_MINUTES = 30;

export type LatLon = { lat: number; lon: number };

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Great-circle distance in kilometres (haversine, mean Earth radius 6371 km). */
export function haversineKm(a: LatLon, b: LatLon): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lon - a.lon);
  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);
  const h =
    sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Block-time estimate: cruise at 850 km/h plus a 30-minute taxi pad. */
export function estimateDurationMin(km: number): number {
  return Math.round((km / CRUISE_KMH) * 60 + TAXI_MINUTES);
}

/** `h:mm` with unpadded hours (0:45, 8:06, 12:30). */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

type Vec3 = [number, number, number];

function toCartesian(p: LatLon): Vec3 {
  const φ = toRad(p.lat);
  const λ = toRad(p.lon);
  const cosφ = Math.cos(φ);
  return [cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ)];
}

function fromCartesian(v: Vec3): LatLon {
  const [x, y, z] = v;
  return {
    lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lon: toDeg(Math.atan2(y, x)),
  };
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-8) return a;
  const so = Math.sin(omega);
  const s1 = Math.sin((1 - t) * omega) / so;
  const s2 = Math.sin(t * omega) / so;
  return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2];
}

/**
 * Interpolated great-circle, returned as GeoJSON [lon, lat] positions.
 * `n` is the number of segments (n+1 points).
 */
export function greatCircleCoords(
  a: LatLon,
  b: LatLon,
  n = 48,
): [number, number][] {
  const va = toCartesian(a);
  const vb = toCartesian(b);
  const steps = Math.max(1, n);
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const p = fromCartesian(slerp(va, vb, i / steps));
    out.push([p.lon, p.lat]);
  }
  return out;
}

/** Split a polyline wherever it jumps the antimeridian so MapLibre can draw it. */
export function splitAntimeridian(
  coords: [number, number][],
): [number, number][][] {
  if (coords.length === 0) return [];
  const parts: [number, number][][] = [];
  let current: [number, number][] = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const next = coords[i];
    if (Math.abs(next[0] - prev[0]) > 180) {
      parts.push(current);
      current = [next];
    } else {
      current.push(next);
    }
  }
  parts.push(current);
  return parts.filter((p) => p.length >= 2);
}
