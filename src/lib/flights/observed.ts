import { estimateDurationMin, haversineKm } from "./geo.ts";
import type { AirportIndex, AirportRecord, Destination } from "./types.ts";
import type { BuiltDataset } from "./pipeline.ts";

export const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Dow = (typeof DOW)[number];

const DOW_RANK = new Map(DOW.map((d, i) => [d, i]));
const DOW_LABEL: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

/** One operated origin→dest service. Weekly pairs are in if they ran once in the window. */
export type OperatedRoute = {
  originIata: string;
  destIata: string;
  airline: string;
  days: string[];
  lastSeen: string;
  flightCount: number;
};

export type ObservedWindow = {
  asOf: string;
  lookbackDays: number;
};

function utcDate(iso: string): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${iso}`);
  return d;
}

export function windowFrom(asOf: string, lookbackDays: number): string {
  const d = utcDate(asOf);
  d.setUTCDate(d.getUTCDate() - lookbackDays);
  return d.toISOString().slice(0, 10);
}

export function formatDays(days: string[] | undefined): string {
  if (!days || days.length === 0) return "";
  const unique = [...new Set(days)];
  if (unique.length === 7) return "Daily";
  return unique
    .slice()
    .sort((a, b) => (DOW_RANK.get(a as Dow) ?? 99) - (DOW_RANK.get(b as Dow) ?? 99))
    .map((d) => DOW_LABEL[d] ?? d)
    .join(" · ");
}

function sortDays(days: string[]): string[] {
  return [...new Set(days)].sort(
    (a, b) => (DOW_RANK.get(a as Dow) ?? 99) - (DOW_RANK.get(b as Dow) ?? 99),
  );
}

type PairAgg = {
  airlines: Set<string>;
  days: Set<string>;
  lastSeen: string;
  flightCount: number;
};

/**
 * Build the same static JSON contract as OpenFlights, from operated/observed legs.
 * A pair is kept if lastSeen is inside [asOf - lookbackDays, asOf]. Daily is not required.
 */
export function buildObservedDataset(
  airportRows: AirportRecord[],
  routes: OperatedRoute[],
  window: ObservedWindow,
): BuiltDataset {
  const from = windowFrom(window.asOf, window.lookbackDays);
  const to = window.asOf;
  const byIata = new Map<string, AirportRecord>();
  for (const ap of airportRows) {
    if (ap.iata) byIata.set(ap.iata, ap);
  }

  const pairs = new Map<string, Map<string, PairAgg>>();
  for (const route of routes) {
    if (route.lastSeen < from || route.lastSeen > to) continue;
    const origin = route.originIata.toUpperCase();
    const dest = route.destIata.toUpperCase();
    if (!byIata.has(origin) || !byIata.has(dest) || origin === dest) continue;

    let destMap = pairs.get(origin);
    if (!destMap) {
      destMap = new Map();
      pairs.set(origin, destMap);
    }
    let agg = destMap.get(dest);
    if (!agg) {
      agg = { airlines: new Set(), days: new Set(), lastSeen: route.lastSeen, flightCount: 0 };
      destMap.set(dest, agg);
    }
    if (route.airline) agg.airlines.add(route.airline);
    for (const d of route.days) agg.days.add(d);
    if (route.lastSeen > agg.lastSeen) agg.lastSeen = route.lastSeen;
    agg.flightCount += route.flightCount;
  }

  const routesByOrigin = new Map<string, Destination[]>();
  let routeCount = 0;
  const destCount = new Map<string, number>();

  for (const [originIata, destMap] of pairs) {
    const origin = byIata.get(originIata);
    if (!origin) continue;
    const destinations: Destination[] = [];
    for (const [dstIata, agg] of destMap) {
      const dest = byIata.get(dstIata);
      if (!dest) continue;
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
        airlines: [...agg.airlines].sort((a, b) => a.localeCompare(b)),
        days: sortDays([...agg.days]),
        lastSeen: agg.lastSeen,
        flightCount: agg.flightCount,
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
