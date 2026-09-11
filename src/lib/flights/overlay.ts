/**
 * AeroDataBox overlay: current operated routes for the busiest origins,
 * merged over the OpenFlights baseline (which keeps the long tail).
 *
 * Source endpoint (RapidAPI): GET /airports/iata/{code}/stats/routes/daily
 * — the /flights/... path variant 404s. Fields read from the response:
 *   { routes: [ { destination: { iata? },
 *                 averageDailyFlights?: number,
 *                 operators?: [ { name? } ] } ] }
 * A schema drift that yields zero routes degrades to the OpenFlights
 * baseline for that origin; the refresh workflow's canary catches it.
 */
import type { BuiltDataset } from "./pipeline.ts";
import type { AirportIndex, Destination } from "./types.ts";
import { DOW, type OperatedRoute } from "./observed.ts";

export type AdbRoute = {
  destination?: { iata?: string | null };
  averageDailyFlights?: number;
  operators?: { name?: string | null }[];
};

export type AdbDailyRoutesPayload = { routes?: AdbRoute[] };

/** At or above this average the service reads as daily; below it the weekday split is unknown. */
const DAILY_THRESHOLD = 0.95;

/**
 * Flatten one airport's daily-route stats into OperatedRoute legs.
 * One leg per operator; the first operator carries the pair's flightCount so
 * buildObservedDataset's per-pair sum stays the pair total, not a multiple.
 */
export function toOperatedRoutes(
  originIata: string,
  payload: AdbDailyRoutesPayload,
  asOf: string,
  lookbackDays: number,
): OperatedRoute[] {
  const out: OperatedRoute[] = [];
  const origin = originIata.toUpperCase();
  for (const route of payload.routes ?? []) {
    const dest = String(route.destination?.iata ?? "").toUpperCase();
    if (!/^[A-Z]{3}$/.test(dest) || dest === origin) continue;
    const avgRaw = Number(route.averageDailyFlights ?? 0);
    const avg = Number.isFinite(avgRaw) && avgRaw > 0 ? avgRaw : 0;
    const flightCount = Math.max(1, Math.round(avg * lookbackDays));
    const days = avg >= DAILY_THRESHOLD ? [...DOW] : [];
    const operators = (route.operators ?? [])
      .map((o) => String(o?.name ?? "").trim())
      .filter(Boolean);
    if (operators.length === 0) operators.push("");
    operators.forEach((airline, i) => {
      out.push({
        originIata: origin,
        destIata: dest,
        airline,
        days,
        lastSeen: asOf,
        flightCount: i === 0 ? flightCount : 0,
      });
    });
  }
  out.sort(
    (a, b) =>
      a.destIata.localeCompare(b.destIata) || a.airline.localeCompare(b.airline),
  );
  return out;
}

function byDuration(a: Destination, b: Destination): number {
  return a.minutes - b.minutes || a.iata.localeCompare(b.iata);
}

/**
 * Observed origins replace the baseline wholesale (current schedules beat the
 * 2014 snapshot: dead routes drop, missing LCC routes appear); every other
 * origin keeps its OpenFlights destinations. An observed A->B is also
 * evidence that B->A operates, so the return leg is mirrored onto B when B is
 * not itself observed: it replaces B's archive row for A or is added. The
 * airport index is recomputed from the merged map so destination counts and
 * the used-airport set agree.
 */
export function mergeObserved(
  base: BuiltDataset,
  observed: BuiltDataset,
): { merged: BuiltDataset; replacedOrigins: string[] } {
  const routesByOrigin = new Map<string, Destination[]>(base.routesByOrigin);
  const replacedOrigins: string[] = [];
  for (const [origin, destinations] of observed.routesByOrigin) {
    if (destinations.length === 0) continue;
    routesByOrigin.set(origin, destinations);
    replacedOrigins.push(origin);
  }
  replacedOrigins.sort();

  const meta = new Map<string, AirportIndex>();
  for (const ap of base.airports) meta.set(ap.iata, ap);
  for (const ap of observed.airports) if (!meta.has(ap.iata)) meta.set(ap.iata, ap);

  const observedOrigins = new Set(replacedOrigins);
  const touched = new Set<string>();
  for (const origin of replacedOrigins) {
    const ap = meta.get(origin);
    if (!ap) continue;
    for (const d of routesByOrigin.get(origin) ?? []) {
      if (observedOrigins.has(d.iata) || !d.lastSeen) continue;
      const mirrored: Destination = {
        ...d,
        iata: ap.iata,
        name: ap.name,
        city: ap.city,
        country: ap.country,
        lat: ap.lat,
        lon: ap.lon,
      };
      const list = (routesByOrigin.get(d.iata) ?? []).filter((x) => x.iata !== origin);
      list.push(mirrored);
      routesByOrigin.set(d.iata, list);
      touched.add(d.iata);
    }
  }
  for (const iata of touched) routesByOrigin.get(iata)!.sort(byDuration);

  const used = new Set<string>();
  let routeCount = 0;
  for (const [origin, dests] of routesByOrigin) {
    used.add(origin);
    routeCount += dests.length;
    for (const d of dests) used.add(d.iata);
  }

  const airports: AirportIndex[] = [];
  for (const iata of used) {
    const ap = meta.get(iata);
    if (!ap) continue;
    airports.push({ ...ap, destinations: routesByOrigin.get(iata)?.length ?? 0 });
  }
  airports.sort(
    (a, b) => b.destinations - a.destinations || a.iata.localeCompare(b.iata),
  );

  return { merged: { airports, routesByOrigin, routeCount }, replacedOrigins };
}
