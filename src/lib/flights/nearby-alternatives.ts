/**
 * "Nonstops a short drive away": observed nonstops that a nearby airport flies
 * and the origin does not fly at all. Pure (no fs), so the airport page loader
 * feeds it route files and the tests feed it synthetic ones.
 */
import { isBookable } from "./operators.ts";
import type { NearbyAirport } from "./seo.ts";
import type { Destination } from "./types.ts";

export const MAX_ALT_KM = 250;
export const MAX_DRIVE_MINUTES = 150;
export const ALTS_PER_AIRPORT = 8;
/** About twice a week in the 30-day window; filters one-off charters the operator list misses. */
export const MIN_ALT_FLIGHTS = 8;
const ROAD_FACTOR = 1.3;
const DRIVE_KMH = 80;
const KM_PER_MILE = 1.609344;

export type AltDestination = Pick<Destination, "iata" | "city" | "country" | "airlines"> & {
  flightCount: number;
};

export type NearbyAlternative = Pick<NearbyAirport, "iata" | "name" | "city" | "km"> & {
  miles: number;
  /** "about 45 min", or a hand-written transit note for a water crossing. */
  drive: string;
  routes: AltDestination[];
};

/**
 * Hand-checked pairs (alphabetical "AAA-BBB") where a straight-line drive
 * estimate would mislead, usually because open water sits between them.
 * A string replaces the drive estimate; null drops the pair. Checked against
 * the 2026-10-16 observed set; revisit when the fetched origins change.
 */
export const CROSSING_OVERRIDES: Record<string, string | null> = {
  // Sturup has no rail link; the Oresund train stops in central Malmö, then a bus. Unverified door to door.
  "CPH-MMX": null,
  "HEL-TLL": null, // Gulf of Finland, ferry only
  "IOM-LPL": null, // Isle of Man, ferry only
  "BID-PVD": null, // Block Island, ferry only
  "MVY-PVD": null, // Martha's Vineyard, ferry only
  "MMX-RNN": null, // Bornholm, ferry only
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/** Straight-line km x 1.3 at 80 km/h, to the nearest 15 minutes (never under 15). */
export function driveMinutes(km: number): number {
  const raw = ((km * ROAD_FACTOR) / DRIVE_KMH) * 60;
  return Math.max(15, Math.round(raw / 15) * 15);
}

/** 45 -> "about 45 min"; 75 -> "about 1 h 15 min"; 120 -> "about 2 h". */
export function formatDrive(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `about ${m} min`;
  return m === 0 ? `about ${h} h` : `about ${h} h ${m} min`;
}

export function nearbyAlternatives(
  origin: {
    iata: string;
    destinations: Destination[];
    /** True for an AeroDataBox-fetched origin; mirrored return legs alone are not a full route list. */
    observed: boolean;
  },
  nearby: { airport: Pick<NearbyAirport, "iata" | "name" | "city" | "km">; destinations: Destination[] }[],
  overrides: Record<string, string | null> = CROSSING_OVERRIDES,
): NearbyAlternative[] {
  // Only an origin with a full observed route list can honestly be said not to fly somewhere.
  const own = origin.destinations;
  if (!origin.observed || !own.some((d) => d.lastSeen)) return [];
  // A destination the origin reaches only by private jet still counts as "not flown".
  const flown = new Set(own.filter((d) => isBookable(d.airlines)).map((d) => d.iata));
  flown.add(origin.iata);

  const out: NearbyAlternative[] = [];
  for (const { airport, destinations } of nearby) {
    if (airport.km > MAX_ALT_KM) continue;
    const key = pairKey(origin.iata, airport.iata);
    let drive: string;
    if (key in overrides) {
      const note = overrides[key];
      if (note === null) continue;
      drive = note;
    } else {
      const minutes = driveMinutes(airport.km);
      if (minutes > MAX_DRIVE_MINUTES) continue;
      drive = formatDrive(minutes);
    }
    const routes = destinations
      .filter(
        (d) =>
          d.lastSeen &&
          (d.flightCount ?? 0) >= MIN_ALT_FLIGHTS &&
          isBookable(d.airlines) &&
          !flown.has(d.iata),
      )
      .map(({ iata, city, country, airlines, flightCount }) => ({
        iata,
        city,
        country,
        airlines,
        flightCount: flightCount ?? 0,
      }))
      .sort((a, b) => b.flightCount - a.flightCount || a.iata.localeCompare(b.iata))
      .slice(0, ALTS_PER_AIRPORT);
    if (routes.length === 0) continue;
    out.push({
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      km: airport.km,
      miles: Math.round(airport.km / KM_PER_MILE),
      drive,
      routes,
    });
  }
  return out;
}
