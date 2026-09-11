import { parseCsvLine, isMissing } from "./csv.ts";
import { isDefunctAirline } from "./defunct.ts";
import { estimateDurationMin, haversineKm } from "./geo.ts";
import type {
  AirportIndex,
  AirportRecord,
  Destination,
  RawRoute,
} from "./types.ts";

function clean(value: string | undefined): string {
  if (!value || isMissing(value)) return "";
  return value.trim();
}

function parseCoord(value: string | undefined): number | null {
  if (!value || isMissing(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseAirports(text: string): AirportRecord[] {
  const rows: AirportRecord[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const lat = parseCoord(cols[6]);
    const lon = parseCoord(cols[7]);
    if (lat === null || lon === null) continue;
    if (lat === 0 && lon === 0) continue;
    const type = clean(cols[12]).toLowerCase() || "airport";
    if (type && type !== "airport") continue;
    const iataRaw = clean(cols[4]).toUpperCase();
    const icaoRaw = clean(cols[5]).toUpperCase();
    const iata = /^[A-Z]{3}$/.test(iataRaw) ? iataRaw : null;
    const icao = /^[A-Z]{4}$/.test(icaoRaw) ? icaoRaw : null;
    rows.push({
      id: clean(cols[0]),
      name: clean(cols[1]) || "Unknown airport",
      city: clean(cols[2]),
      country: clean(cols[3]),
      iata,
      icao,
      lat,
      lon,
      type,
    });
  }
  return rows;
}

/** Map airline OpenFlights ID → display name, plus IATA → name fallback. */
export function parseAirlines(text: string): {
  byId: Map<string, string>;
  byIata: Map<string, string>;
} {
  const byId = new Map<string, string>();
  const byIata = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const id = clean(cols[0]);
    const name = clean(cols[1]);
    if (!id || !name) continue;
    byId.set(id, name);
    const iata = clean(cols[3]).toUpperCase();
    if (/^[A-Z0-9]{2}$/.test(iata) && iata !== "--") {
      if (!byIata.has(iata)) byIata.set(iata, name);
    }
  }
  return { byId, byIata };
}

export function parseRoutes(text: string): RawRoute[] {
  const rows: RawRoute[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const stops = Number(cols[7] ?? "0");
    rows.push({
      airline: clean(cols[0]).toUpperCase(),
      airlineId: clean(cols[1]),
      src: clean(cols[2]).toUpperCase(),
      srcId: clean(cols[3]),
      dst: clean(cols[4]).toUpperCase(),
      dstId: clean(cols[5]),
      codeshare: clean(cols[6]).toUpperCase() === "Y",
      stops: Number.isFinite(stops) ? stops : 0,
    });
  }
  return rows;
}

type AirlineLookup = {
  byId: Map<string, string>;
  byIata: Map<string, string>;
};

function airlineName(route: RawRoute, lookup: AirlineLookup): string | null {
  const fromId = lookup.byId.get(route.airlineId);
  if (fromId && fromId !== "Unknown") return fromId;
  if (route.airline && lookup.byIata.has(route.airline)) {
    return lookup.byIata.get(route.airline) ?? null;
  }
  if (route.airline && /^[A-Z0-9]{2}$/.test(route.airline)) return route.airline;
  return fromId ?? null;
}

function resolveAirport(
  code: string,
  id: string,
  byId: Map<string, AirportRecord>,
  byIata: Map<string, AirportRecord>,
  byIcao: Map<string, AirportRecord>,
): AirportRecord | null {
  if (code.length === 3 && byIata.has(code)) return byIata.get(code) ?? null;
  if (code.length === 4 && byIcao.has(code)) return byIcao.get(code) ?? null;
  if (id && byId.has(id)) return byId.get(id) ?? null;
  return null;
}

export type BuiltDataset = {
  airports: AirportIndex[];
  routesByOrigin: Map<string, Destination[]>;
  routeCount: number;
};

/**
 * Clean OpenFlights dumps into the static JSON contract:
 * drop missing coords / IATA, codeshares, multi-stop, duplicates;
 * aggregate airlines per origin→destination; sort destinations by duration.
 */
export function buildDataset(
  airportRows: AirportRecord[],
  airlineLookup: AirlineLookup,
  routes: RawRoute[],
): BuiltDataset {
  const byId = new Map<string, AirportRecord>();
  const byIata = new Map<string, AirportRecord>();
  const byIcao = new Map<string, AirportRecord>();
  for (const ap of airportRows) {
    if (ap.id) byId.set(ap.id, ap);
    if (ap.iata) byIata.set(ap.iata, ap);
    if (ap.icao) byIcao.set(ap.icao, ap);
  }

  // originIata -> destIata -> airline names (unique, insertion order)
  const pairAirlines = new Map<string, Map<string, string[]>>();
  const seen = new Set<string>();

  for (const route of routes) {
    if (route.codeshare) continue;
    if (route.stops > 0) continue;
    const src = resolveAirport(route.src, route.srcId, byId, byIata, byIcao);
    const dst = resolveAirport(route.dst, route.dstId, byId, byIata, byIcao);
    if (!src?.iata || !dst?.iata) continue;
    if (src.iata === dst.iata) continue;
    const airline = airlineName(route, airlineLookup);
    const dupeKey = `${src.iata}|${dst.iata}|${airline ?? route.airlineId}`;
    if (seen.has(dupeKey)) continue;
    seen.add(dupeKey);

    let destMap = pairAirlines.get(src.iata);
    if (!destMap) {
      destMap = new Map();
      pairAirlines.set(src.iata, destMap);
    }
    let airlines = destMap.get(dst.iata);
    if (!airlines) {
      airlines = [];
      destMap.set(dst.iata, airlines);
    }
    if (airline && !airlines.includes(airline)) airlines.push(airline);
  }

  const routesByOrigin = new Map<string, Destination[]>();
  let routeCount = 0;
  const destCount = new Map<string, number>();

  for (const [originIata, destMap] of pairAirlines) {
    const origin = byIata.get(originIata);
    if (!origin) continue;
    const destinations: Destination[] = [];
    for (const [dstIata, allAirlines] of destMap) {
      const dest = byIata.get(dstIata);
      if (!dest) continue;
      // A pair flown only by carriers that have since folded is not a
      // nonstop route any more; an unresolved (empty) list stays as-is.
      const airlines = allAirlines.filter((a) => !isDefunctAirline(a));
      if (allAirlines.length > 0 && airlines.length === 0) continue;
      const km = Math.round(
        haversineKm(
          { lat: origin.lat, lon: origin.lon },
          { lat: dest.lat, lon: dest.lon },
        ),
      );
      destinations.push({
        iata: dest.iata!,
        name: dest.name,
        city: dest.city,
        country: dest.country,
        lat: dest.lat,
        lon: dest.lon,
        km,
        minutes: estimateDurationMin(km),
        airlines: airlines.slice().sort((a, b) => a.localeCompare(b)),
      });
    }
    destinations.sort((a, b) => a.minutes - b.minutes || a.iata.localeCompare(b.iata));
    routesByOrigin.set(originIata, destinations);
    destCount.set(originIata, destinations.length);
    routeCount += destinations.length;
  }

  const used = new Set<string>();
  for (const [origin, dests] of routesByOrigin) {
    used.add(origin);
    for (const d of dests) used.add(d.iata);
  }

  const airports: AirportIndex[] = [];
  for (const ap of byIata.values()) {
    if (!ap.iata || !used.has(ap.iata)) continue;
    airports.push({
      iata: ap.iata,
      name: ap.name,
      city: ap.city,
      country: ap.country,
      lat: ap.lat,
      lon: ap.lon,
      destinations: destCount.get(ap.iata) ?? 0,
    });
  }
  airports.sort((a, b) => b.destinations - a.destinations || a.iata.localeCompare(b.iata));

  return { airports, routesByOrigin, routeCount };
}
