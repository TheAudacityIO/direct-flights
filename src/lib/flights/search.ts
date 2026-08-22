import type { AirportIndex } from "./types.ts";

export function normalizeQuery(q: string): string {
  return q
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function startsWithFold(hay: string, needle: string): boolean {
  return normalizeQuery(hay).startsWith(needle);
}

function includesFold(hay: string, needle: string): boolean {
  return normalizeQuery(hay).includes(needle);
}

/**
 * Ranked airport autocomplete. Exact IATA wins, then prefixes, then contains.
 * Destination count is a mild tie-breaker so hubs surface first.
 */
export function searchAirports(
  airports: AirportIndex[],
  query: string,
  limit = 8,
): AirportIndex[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const scored: { ap: AirportIndex; score: number }[] = [];
  for (const ap of airports) {
    const iata = ap.iata.toLowerCase();
    let score = -1;
    if (iata === q) score = 1000;
    else if (iata.startsWith(q)) score = 800;
    else if (startsWithFold(ap.city, q)) score = 600;
    else if (startsWithFold(ap.name, q)) score = 500;
    else if (includesFold(ap.city, q)) score = 300;
    else if (includesFold(ap.name, q)) score = 200;
    else if (startsWithFold(ap.country, q)) score = 100;
    if (score < 0) continue;
    score += Math.min(50, ap.destinations / 10);
    scored.push({ ap, score });
  }
  scored.sort(
    (a, b) => b.score - a.score || a.ap.iata.localeCompare(b.ap.iata),
  );
  const out: AirportIndex[] = [];
  const seen = new Set<string>();
  for (const { ap } of scored) {
    if (seen.has(ap.iata)) continue;
    seen.add(ap.iata);
    out.push(ap);
    if (out.length >= limit) break;
  }
  return out;
}
