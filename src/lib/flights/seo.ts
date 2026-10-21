/** Pure helpers for the per-airport pages and the sitemap (no fs, testable). */
import { haversineKm } from "./geo.ts";
import { isBookable } from "./operators.ts";
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

/** Search Console keep list (data/search/keep-pages.json): pages with impressions in the last 90 days. */
export type KeepPages = { airports: string[]; countries: string[] };

/**
 * An airport page is indexable when we observed its routes (AeroDataBox) or
 * Search Console has shown it. Everything else stays linked and crawlable
 * but noindex and out of the sitemap.
 */
export function isAirportIndexable(iata: string, observedCodes: ReadonlySet<string>, keep: KeepPages): boolean {
  return observedCodes.has(iata) || keep.airports.includes(iata);
}

/** A country page is indexable when Search Console has shown it or one of its origins is observed. */
export function isCountryIndexable(
  slug: string,
  originCodes: string[],
  observedCodes: ReadonlySet<string>,
  keep: KeepPages,
): boolean {
  return keep.countries.includes(slug) || originCodes.some((c) => observedCodes.has(c));
}

/** Last archive cleanup: the date archive-only pages last changed. */
export const ARCHIVE_LASTMOD = "2026-09-22";

/** Observed pages change with each refresh (windowTo); archive pages with the last cleanup. */
export function airportLastmod(observed: boolean, meta: Pick<DatasetMeta, "windowTo">): string {
  return observed && meta.windowTo ? meta.windowTo : ARCHIVE_LASTMOD;
}

/**
 * Rows seen operating that someone can buy a seat on: drops private jet,
 * charter and cargo-only rows, and those operators from mixed rows.
 */
export function bookableObserved(destinations: Destination[]): Destination[] {
  return destinations
    .filter((d) => d.lastSeen && isBookable(d.airlines))
    .map((d) => ({ ...d, airlines: d.airlines.filter((a) => isBookable([a])) }));
}

/** The answer-first sentence for an observed airport, from its bookable observed rows. */
export function observedSentence(
  ap: Pick<AirportIndex, "iata" | "name" | "city">,
  destinations: Destination[],
  meta: Pick<DatasetMeta, "windowFrom" | "windowTo">,
): string | null {
  const rows = bookableObserved(destinations);
  if (!meta.windowFrom || !meta.windowTo || rows.length === 0) return null;
  const airlines = new Set(rows.flatMap((d) => d.airlines)).size;
  return `Between ${meta.windowFrom} and ${meta.windowTo} we saw ${airlines} ${
    airlines === 1 ? "airline" : "airlines"
  } fly nonstop from ${ap.city || ap.name} (${ap.iata}) to ${rows.length} ${
    rows.length === 1 ? "destination" : "destinations"
  }.`;
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
  // Leads with the phrase people search ("bodrum direct flights") and stays
  // under Google's ~60-character cut.
  return `${ap.city || ap.name} direct flights: ${count} nonstop ${
    count === 1 ? "destination" : "destinations"
  } from ${ap.iata}`;
}

export function archiveAirportPageTitle(ap: Pick<AirportIndex, "iata" | "name" | "city">, count: number): string {
  return `${ap.city || ap.name} direct flights from ${ap.iata}: ${count} ${count === 1 ? "route" : "routes"} (historical data)`;
}

/** Archive-only airports say so up front; the farthest cities are added only while it fits ~155 characters. */
export function archiveAirportPageDescription(
  ap: Pick<AirportIndex, "iata" | "name" | "city" | "country">,
  destinations: Destination[],
): string {
  const countries = new Set(destinations.map((d) => d.country)).size;
  const head = `Historical list of nonstop routes from ${airportLabel(ap)}, ${ap.country}: ${destinations.length} ${
    destinations.length === 1 ? "destination" : "destinations"
  } in ${countries} ${countries === 1 ? "country" : "countries"}`;
  const top = destinations
    .slice()
    .sort((a, b) => b.km - a.km)
    .slice(0, 2)
    .map((d) => d.city || d.name);
  const long = `${head}, as far as ${top.join(", ")}.`;
  return top.length > 0 && long.length <= 155 ? long : `${head}.`;
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
  const airlines = new Set(destinations.flatMap((d) => d.airlines)).size;
  const head = `${ap.city || ap.name} airport destinations: ${destinations.length} nonstop ${
    destinations.length === 1 ? "flight" : "flights"
  } from ${airportLabel(ap)}, ${ap.country}, to ${countries} ${
    countries === 1 ? "country" : "countries"
  } on ${airlines} ${airlines === 1 ? "airline" : "airlines"}`;
  return top.length > 0 ? `${head}, as far as ${top.join(", ")}.` : `${head}.`;
}

/** Airlines at an origin, most nonstop destinations first (ties by name). */
export function airlinesByRoutes(destinations: Destination[]): { airline: string; routes: number }[] {
  const counts = new Map<string, number>();
  for (const d of destinations) for (const a of new Set(d.airlines)) counts.set(a, (counts.get(a) ?? 0) + 1);
  return [...counts]
    .map(([airline, routes]) => ({ airline, routes }))
    .sort((a, b) => b.routes - a.routes || a.airline.localeCompare(b.airline));
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

/** Structured data (schema.org JSON-LD) as a TanStack head `scripts` entry. `<` is escaped so data can never close the tag. */
export function jsonLdScript(data: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c"),
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: SITE_ORIGIN + c.path,
    })),
  };
}

/** Breadcrumb trail for /from/{IATA}: site, airports hub, country, airport. */
export function airportCrumbs(ap: Pick<AirportIndex, "iata" | "name" | "city" | "country">): Crumb[] {
  return [
    { name: "FlyDirectFrom", path: "/" },
    { name: "Airports", path: "/from" },
    { name: ap.country, path: countryPagePath(ap.country) },
    { name: `${ap.city || ap.name} (${ap.iata})`, path: airportPagePath(ap.iata) },
  ];
}

/** Breadcrumb trail for /countries/{slug}: site, airports hub, country. */
export function countryCrumbs(country: string): Crumb[] {
  return [
    { name: "FlyDirectFrom", path: "/" },
    { name: "Airports", path: "/from" },
    { name: country, path: countryPagePath(country) },
  ];
}

/** The airport page as a WebPage about a schema.org Airport (iataCode is the searchable key). */
export function airportPageJsonLd(
  ap: Pick<AirportIndex, "iata" | "name" | "city" | "country" | "lat" | "lon">,
  name: string,
  dateModified: string,
): Record<string, unknown> {
  return {
    "@type": "WebPage",
    "@id": SITE_ORIGIN + airportPagePath(ap.iata),
    url: SITE_ORIGIN + airportPagePath(ap.iata),
    name,
    dateModified,
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    about: {
      "@type": "Airport",
      name: ap.name,
      iataCode: ap.iata,
      address: { "@type": "PostalAddress", addressLocality: ap.city || undefined, addressCountry: ap.country },
      geo: { "@type": "GeoCoordinates", latitude: ap.lat, longitude: ap.lon },
    },
  };
}

/** Site-level WebSite node, emitted on the home page; airport pages point at it via isPartOf. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    url: `${SITE_ORIGIN}/`,
    name: "FlyDirectFrom",
    description:
      "Where can you fly direct? Pick an airport and see every nonstop destination with airlines, distance and estimated flight time.",
    publisher: { "@type": "Organization", name: "The Audacity" },
  };
}

export type SitemapEntry = { path: string; lastmod: string };

export function buildSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => `  <url><loc>${SITE_ORIGIN}${e.path}</loc><lastmod>${e.lastmod.slice(0, 10)}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const STATIC_PAGES = ["/", "/from", "/about-the-data", "/privacy", "/blog"];

/**
 * public/sitemap.xml from the built dataset: static pages, then indexable
 * country and airport pages. build-openflights.ts and build-sitemap.ts both
 * call this, so the two cannot drift.
 */
export function datasetSitemapEntries(
  airports: Pick<AirportIndex, "iata" | "country" | "destinations">[],
  meta: Pick<DatasetMeta, "generatedAt" | "windowTo" | "observedOriginCodes">,
  keep: KeepPages,
): SitemapEntry[] {
  const observed = new Set(meta.observedOriginCodes ?? []);
  const origins = airports.filter((a) => a.destinations > 0);
  const byCountry = new Map<string, string[]>();
  for (const a of origins) byCountry.set(a.country, [...(byCountry.get(a.country) ?? []), a.iata]);
  return [
    ...STATIC_PAGES.map((path) => ({ path, lastmod: meta.generatedAt })),
    ...[...byCountry.keys()]
      .sort()
      .filter((country) => isCountryIndexable(countrySlug(country), byCountry.get(country) ?? [], observed, keep))
      .map((country) => ({
        path: countryPagePath(country),
        // A country page changes with each refresh when one of its origins is observed.
        lastmod: airportLastmod((byCountry.get(country) ?? []).some((c) => observed.has(c)), meta),
      })),
    ...origins
      .map((a) => a.iata)
      .filter((iata) => isAirportIndexable(iata, observed, keep))
      .sort()
      .map((iata) => ({ path: airportPagePath(iata), lastmod: airportLastmod(observed.has(iata), meta) })),
  ];
}
