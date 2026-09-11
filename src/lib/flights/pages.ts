/**
 * Server functions behind the crawlable airport pages. Handlers import the
 * fs reader dynamically so it never enters the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { countrySlug, nearbyAirports, type NearbyAirport } from "./seo.ts";
import type { AirportIndex, DatasetMeta, Destination } from "./types.ts";

export type AirportPageData = {
  origin: AirportIndex;
  destinations: Destination[];
  nearby: NearbyAirport[];
  /** Destination codes that have no /from page of their own (no departures in the data). */
  pageless: string[];
  meta: DatasetMeta;
};

export const getAirportPage = createServerFn({ method: "GET" })
  .inputValidator((iata: string) => iata.toUpperCase())
  .handler(async ({ data: iata }): Promise<AirportPageData | null> => {
    const { readAirports, readMeta, readRoutes } = await import("./dataset.server.ts");
    const [airports, meta, routes] = await Promise.all([
      readAirports(),
      readMeta(),
      readRoutes(iata),
    ]);
    const origin = airports.find((a) => a.iata === iata);
    if (!origin || !routes || routes.destinations.length === 0) return null;
    const withPage = new Set(airports.filter((a) => a.destinations > 0).map((a) => a.iata));
    return {
      origin,
      destinations: routes.destinations,
      nearby: nearbyAirports(origin, airports),
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
  meta: DatasetMeta;
};

export const getCountryPage = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<CountryPageData | null> => {
    const { readAirports, readMeta } = await import("./dataset.server.ts");
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
    return { country: entries[0].country, airports: entries, meta };
  });

export const getDatasetMeta = createServerFn({ method: "GET" }).handler(
  async (): Promise<DatasetMeta> => {
    const { readMeta } = await import("./dataset.server.ts");
    return readMeta();
  },
);
