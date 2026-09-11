/** Pure helpers for the per-airport pages and the sitemap (no fs, testable). */
import type { AirportIndex, DatasetMeta, Destination } from "./types.ts";

export const SITE_ORIGIN = "https://flydirectfrom.com";

export function airportPagePath(iata: string): string {
  return `/from/${iata.toUpperCase()}`;
}

export function airportLabel(ap: Pick<AirportIndex, "iata" | "name" | "city">): string {
  const place = ap.city && ap.city !== ap.name ? `${ap.city} ${ap.name}` : ap.name;
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
  const observed = destinations.some((d) => d.lastSeen);
  if (observed && meta.windowFrom && meta.windowTo) {
    return `Routes observed operating between ${meta.windowFrom} and ${meta.windowTo} (AeroDataBox). Estimated durations, not a timetable.`;
  }
  return "Routes from the OpenFlights archive (~2014) with defunct carriers removed; not verified as current. Estimated durations, not a timetable.";
}

export function buildSitemap(paths: string[], lastmod: string): string {
  const day = lastmod.slice(0, 10);
  const urls = paths
    .map((p) => `  <url><loc>${SITE_ORIGIN}${p}</loc><lastmod>${day}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
