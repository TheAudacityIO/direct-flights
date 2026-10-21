/**
 * Server functions behind the crawlable airport pages. Handlers import the
 * fs reader dynamically so it never enters the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  bookableObserved,
  countrySlug,
  isAirportIndexable,
  isCountryIndexable,
  nearbyAirports,
  type NearbyAirport,
} from "./seo.ts";
import { MAX_ALT_KM, nearbyAlternatives, type NearbyAlternative } from "./nearby-alternatives.ts";
import type { AirportIndex, DatasetMeta, Destination } from "./types.ts";

export type AirportPageData = {
  origin: AirportIndex;
  /** On observed origins, only the bookable observed rows (see bookableObserved). */
  destinations: Destination[];
  /** Routes come from AeroDataBox (meta.observedOriginCodes), not the archive. */
  observed: boolean;
  indexable: boolean;
  nearby: NearbyAirport[];
  /** Observed nonstops from airports a short drive away that the origin does not fly. */
  alternatives: NearbyAlternative[];
  /** Destination codes that have no /from page of their own (no departures in the data). */
  pageless: string[];
  meta: DatasetMeta;
};

export const getAirportPage = createServerFn({ method: "GET" })
  .inputValidator((iata: string) => iata.toUpperCase())
  .handler(async ({ data: iata }): Promise<AirportPageData | null> => {
    const { readAirports, readKeepPages, readMeta, readRoutes } = await import("./dataset.server.ts");
    const [airports, meta, routes] = await Promise.all([
      readAirports(),
      readMeta(),
      readRoutes(iata),
    ]);
    const origin = airports.find((a) => a.iata === iata);
    if (!origin || !routes || routes.destinations.length === 0) return null;
    const withPage = new Set(airports.filter((a) => a.destinations > 0).map((a) => a.iata));
    const observedCodes = new Set(meta.observedOriginCodes ?? []);
    const observed = observedCodes.has(iata);
    // Only observed origins qualify: other fields nearby carry mirrored business-jet
    // legs (NetJets, Flexjet) or military traffic nobody can book.
    const candidates = observed
      ? nearbyAirports(origin, airports.filter((a) => observedCodes.has(a.iata)), 12, MAX_ALT_KM)
      : [];
    const candidateRoutes = await Promise.all(candidates.map((a) => readRoutes(a.iata)));
    return {
      origin,
      destinations: observed ? bookableObserved(routes.destinations) : routes.destinations,
      observed,
      indexable: isAirportIndexable(iata, observedCodes, readKeepPages()),
      nearby: nearbyAirports(origin, airports),
      alternatives: nearbyAlternatives(
        { iata, destinations: routes.destinations, observed },
        candidates.map((airport, i) => ({ airport, destinations: candidateRoutes[i]?.destinations ?? [] })),
      ),
      pageless: routes.destinations.map((d) => d.iata).filter((i) => !withPage.has(i)),
      meta,
    };
  });

export type AirportIndexEntry = Pick<
  AirportIndex,
  "iata" | "name" | "city" | "country" | "destinations"
>;

export type CountryIndexEntry = {
  country: string;
  slug: string;
  airports: number;
  /** Sum of nonstop destinations across the country's origins. */
  routes: number;
  /** Best-connected origins, for the hub page; the country page lists them all. */
  top: AirportIndexEntry[];
};

const TOP_PER_COUNTRY = 6;

/** Every country with at least one origin, most connected first. */
export const getCountryIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ countries: CountryIndexEntry[]; meta: DatasetMeta }> => {
    const { readAirports, readMeta } = await import("./dataset.server.ts");
    const [airports, meta] = await Promise.all([readAirports(), readMeta()]);
    const byCountry = new Map<string, CountryIndexEntry>();
    for (const a of airports) {
      if (a.destinations === 0) continue;
      const entry = byCountry.get(a.country) ?? {
        country: a.country,
        slug: countrySlug(a.country),
        airports: 0,
        routes: 0,
        top: [],
      };
      entry.airports += 1;
      entry.routes += a.destinations;
      // airports.json is sorted by destinations desc, so the first N are the top N.
      if (entry.top.length < TOP_PER_COUNTRY) {
        const { iata, name, city, country, destinations } = a;
        entry.top.push({ iata, name, city, country, destinations });
      }
      byCountry.set(a.country, entry);
    }
    const countries = [...byCountry.values()].sort(
      (a, b) => b.routes - a.routes || a.country.localeCompare(b.country),
    );
    return { countries, meta };
  },
);

export type CountryPageData = {
  country: string;
  airports: AirportIndexEntry[];
  indexable: boolean;
  meta: DatasetMeta;
};

export const getCountryPage = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<CountryPageData | null> => {
    const { readAirports, readKeepPages, readMeta } = await import("./dataset.server.ts");
    const [airports, meta] = await Promise.all([readAirports(), readMeta()]);
    const entries = airports
      .filter((a) => a.destinations > 0 && countrySlug(a.country) === slug)
      .map(({ iata, name, city, country, destinations }) => ({
        iata,
        name,
        city,
        country,
        destinations,
      }));
    if (entries.length === 0) return null;
    const indexable = isCountryIndexable(
      slug,
      entries.map((e) => e.iata),
      new Set(meta.observedOriginCodes ?? []),
      readKeepPages(),
    );
    return { country: entries[0].country, airports: entries, indexable, meta };
  });

const POPULAR_ORIGINS = 12;

/** Best-connected origins, for the home page's crawlable links (airports.json is sorted by destinations desc). */
export const getPopularOrigins = createServerFn({ method: "GET" }).handler(
  async (): Promise<AirportIndexEntry[]> => {
    const { readAirports } = await import("./dataset.server.ts");
    const airports = await readAirports();
    return airports
      .filter((a) => a.destinations > 0)
      .slice(0, POPULAR_ORIGINS)
      .map(({ iata, name, city, country, destinations }) => ({
        iata,
        name,
        city,
        country,
        destinations,
      }));
  },
);

export const getDatasetMeta = createServerFn({ method: "GET" }).handler(
  async (): Promise<DatasetMeta> => {
    const { readMeta } = await import("./dataset.server.ts");
    return readMeta();
  },
);
