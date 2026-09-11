/**
 * Server functions behind the crawlable airport pages. Handlers import the
 * fs reader dynamically so it never enters the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import type { AirportIndex, DatasetMeta, Destination } from "./types.ts";

export type AirportPageData = {
  origin: AirportIndex;
  destinations: Destination[];
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
    return { origin, destinations: routes.destinations, meta };
  });

export type AirportIndexEntry = Pick<
  AirportIndex,
  "iata" | "name" | "city" | "country" | "destinations"
>;

export const getAirportIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ airports: AirportIndexEntry[]; meta: DatasetMeta }> => {
    const { readAirports, readMeta } = await import("./dataset.server.ts");
    const [airports, meta] = await Promise.all([readAirports(), readMeta()]);
    // Only the fields the index renders: the payload is dehydrated into the page.
    const entries = airports
      .filter((a) => a.destinations > 0)
      .map(({ iata, name, city, country, destinations }) => ({
        iata,
        name,
        city,
        country,
        destinations,
      }));
    return { airports: entries, meta };
  },
);
