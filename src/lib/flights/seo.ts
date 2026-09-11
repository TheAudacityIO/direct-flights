/** Pure helpers for the per-airport pages and the sitemap (no fs, testable). */
import { haversineKm } from "./geo.ts";
import type { AirportIndex, DatasetMeta, Destination } from "./types.ts";

export const SITE_ORIGIN = "https://flydirectfrom.com";

/** Title, description and share (og:*) tags for one page in the shape TanStack's head() wants. */
export function pageMeta(title: string, description: string, path: string) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: SITE_ORIGIN + path },
  ];
}

export function airportPagePath(iata: string): string {
  return `/from/${iata.toUpperCase()}`;
}

/** `Congo (Kinshasa)` -> `congo-kinshasa`; unique across the dataset's 222 countries. */
export function countrySlug(country: string): string {
  return country
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function countryPagePath(country: string): string {
  return `/countries/${countrySlug(country)}`;
}

export function countryPageTitle(country: string, airportCount: number): string {
  return `Direct flights from ${country}: ${airportCount} ${
    airportCount === 1 ? "airport" : "airports"
  } with nonstop routes`;
}

export type NearbyAirport = Pick<AirportIndex, "iata" | "name" | "city" | "country" | "destinations"> & {
  km: number;
};

/** Closest other origins within `maxKm`, nearest first: the "also consider" links. */
export function nearbyAirports(
  origin: Pick<AirportIndex, "iata" | "lat" | "lon">,
  airports: AirportIndex[],
  limit = 6,
  maxKm = 400,
): NearbyAirport[] {
  return airports
    .filter((a) => a.iata !== origin.iata && a.destinations > 0)
    .map(({ iata, name, city, country, destinations, lat, lon }) => ({
      iata,
      name,
      city,
      country,
      destinations,
      km: Math.round(haversineKm(origin, { lat, lon })),
    }))
    .filter((a) => a.km <= maxKm)
    .sort((a, b) => a.km - b.km || a.iata.localeCompare(b.iata))
    .slice(0, limit);
}

export type AirportGlance = {
  countries: number;
  airlines: number;
  verified: number;
  longest: Destination | null;
  shortest: Destination | null;
};

export function airportGlance(destinations: Destination[]): AirportGlance {
  const byKm = destinations.slice().sort((a, b) => a.km - b.km);
  return {
    countries: new Set(destinations.map((d) => d.country)).size,
    airlines: new Set(destinations.flatMap((d) => d.airlines)).size,
    verified: destinations.filter((d) => d.lastSeen).length,
    longest: byKm.at(-1) ?? null,
    shortest: byKm[0] ?? null,
  };
}

const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** "Rome Fiumicino (FCO)"; the city is not repeated when the name already starts with it ("London Heathrow Airport (LHR)"). */
export function airportLabel(ap: Pick<AirportIndex, "iata" | "name" | "city">): string {
  const repeats = !ap.city || ap.city === ap.name || fold(ap.name).startsWith(fold(ap.city));
  const place = repeats ? ap.name : `${ap.city} ${ap.name}`;
  return `${place} (${ap.iata})`;
}

export function airportPageTitle(
  ap: Pick<AirportIndex, "iata" | "name" | "city">,
  count: number,
): string {
  return `Direct flights from ${ap.city || ap.name} (${ap.iata}): ${count} nonstop ${
    count === 1 ? "destination" : "destinations"
  }`;
}

export function airportPageDescription(
  ap: Pick<AirportIndex, "iata" | "name" | "city" | "country">,
  destinations: Destination[],
): string {
  const countries = new Set(destinations.map((d) => d.country)).size;
  const top = destinations
    .slice()
    .sort((a, b) => b.km - a.km)
    .slice(0, 3)
    .map((d) => d.city || d.name);
  const head = `Where can you fly direct from ${airportLabel(ap)}, ${ap.country}? ${
    destinations.length
  } nonstop ${destinations.length === 1 ? "destination" : "destinations"} in ${countries} ${
    countries === 1 ? "country" : "countries"
  }`;
  return top.length > 0 ? `${head}, as far as ${top.join(", ")}.` : `${head}.`;
}

/** One honest sentence about where this origin's rows come from. */
export function provenanceSentence(
  destinations: Destination[],
  meta: Pick<DatasetMeta, "windowFrom" | "windowTo">,
): string {
  const verified = destinations.filter((d) => d.lastSeen).length;
  if (verified === destinations.length && verified > 0 && meta.windowFrom && meta.windowTo) {
    return `Routes observed operating between ${meta.windowFrom} and ${meta.windowTo} (AeroDataBox). Estimated durations, not a timetable.`;
  }
  if (verified > 0 && meta.windowFrom && meta.windowTo) {
    return `${verified} of ${destinations.length} routes observed operating between ${meta.windowFrom} and ${meta.windowTo} (AeroDataBox); the rest come from the OpenFlights archive (~2014), known defunct carriers removed. Estimated durations, not a timetable.`;
  }
  return "Routes from the OpenFlights archive (~2014) with known defunct carriers removed; not verified as current. Estimated durations, not a timetable.";
}

export function buildSitemap(paths: string[], lastmod: string): string {
  const day = lastmod.slice(0, 10);
  const urls = paths
    .map((p) => `  <url><loc>${SITE_ORIGIN}${p}</loc><lastmod>${day}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
