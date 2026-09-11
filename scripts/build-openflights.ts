/**
 * Download-or-read OpenFlights dumps, clean them, emit the static JSON contract:
 *   public/data/airports.json
 *   public/data/routes/{IATA}.json
 *   public/data/meta.json
 *
 * Usage:
 *   npm run data:build
 *   npm run data:build -- --force
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseAirports, parseAirlines, parseRoutes, buildDataset } from "../src/lib/flights/pipeline.ts";
import { buildObservedDataset, windowFrom } from "../src/lib/flights/observed.ts";
import { mergeObserved } from "../src/lib/flights/overlay.ts";
import { airportPagePath, buildSitemap } from "../src/lib/flights/seo.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW = path.join(ROOT, "data/raw");
const OUT = path.join(ROOT, "public/data");
const FORCE = process.argv.includes("--force");

const FILES = {
  airports: "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat",
  routes: "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat",
  airlines: "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat",
} as const;

async function ensureRaw(name: keyof typeof FILES): Promise<string> {
  const dest = path.join(RAW, `${name}.dat`);
  if (!FORCE && existsSync(dest)) return readFile(dest, "utf8");
  const res = await fetch(FILES[name]);
  if (!res.ok) throw new Error(`Failed to download ${FILES[name]}: ${res.status}`);
  const text = await res.text();
  await mkdir(RAW, { recursive: true });
  await writeFile(dest, text);
  return text;
}

async function main() {
  const [airportsDat, airlinesDat, routesDat] = await Promise.all([
    ensureRaw("airports"),
    ensureRaw("airlines"),
    ensureRaw("routes"),
  ]);

  const airportRows = parseAirports(airportsDat);
  const built = buildDataset(airportRows, parseAirlines(airlinesDat), parseRoutes(routesDat));

  // AeroDataBox overlay: observed origins replace the baseline; the long
  // tail stays OpenFlights. Absent file = plain baseline build.
  const OBSERVED = path.join(ROOT, "data/observed/operated-routes.json");
  let dataset = built;
  let overlay: { source: string; asOf: string; lookbackDays: number; origins: number } | null =
    null;
  if (existsSync(OBSERVED)) {
    const file = JSON.parse(await readFile(OBSERVED, "utf8"));
    const observedBuilt = buildObservedDataset(airportRows, file.routes, {
      asOf: file.asOf,
      lookbackDays: file.lookbackDays,
    });
    const res = mergeObserved(built, observedBuilt);
    dataset = res.merged;
    overlay = {
      source: file.source,
      asOf: file.asOf,
      lookbackDays: file.lookbackDays,
      origins: res.replacedOrigins.length,
    };
  }

  const routesDir = path.join(OUT, "routes");
  await rm(routesDir, { recursive: true, force: true });
  await mkdir(routesDir, { recursive: true });

  await writeFile(path.join(OUT, "airports.json"), JSON.stringify(dataset.airports));

  const writes: Promise<void>[] = [];
  for (const [iata, destinations] of dataset.routesByOrigin) {
    writes.push(
      writeFile(
        path.join(routesDir, `${iata}.json`),
        JSON.stringify({ origin: iata, destinations }),
      ),
    );
  }
  await Promise.all(writes);

  const originCount = dataset.routesByOrigin.size;
  const meta = {
    source: overlay ? "OpenFlights + AeroDataBox overlay" : "OpenFlights",
    attribution:
      "Airport and route data © OpenFlights.org (https://openflights.org/data.html)" +
      (overlay ? "; current-route overlay via AeroDataBox (https://aerodatabox.com)" : ""),
    generatedAt: new Date().toISOString(),
    airportCount: dataset.airports.length,
    originCount,
    routeCount: dataset.routeCount,
    note: overlay
      ? `Routes from the OpenFlights archive (~2014, defunct carriers removed), with routes observed operating in the ${overlay.lookbackDays} days to ${overlay.asOf} for ${overlay.origins === 1 ? "one airport" : `${overlay.origins} airports`} (AeroDataBox). Not a live timetable.`
      : "Routes from the OpenFlights archive (~2014, defunct carriers removed). Not a live timetable.",
    ...(overlay
      ? {
          lookbackDays: overlay.lookbackDays,
          windowFrom: windowFrom(overlay.asOf, overlay.lookbackDays),
          windowTo: overlay.asOf,
          observedOrigins: overlay.origins,
        }
      : {}),
  };
  await writeFile(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2));

  // One crawlable page per origin, plus the static pages.
  const pages = ["/", "/from", "/privacy", ...[...dataset.routesByOrigin.keys()].sort().map(airportPagePath)];
  await writeFile(path.join(ROOT, "public/sitemap.xml"), buildSitemap(pages, meta.generatedAt));

  const sample = (code: string) => dataset.routesByOrigin.get(code)?.length ?? 0;
  console.log(
    JSON.stringify(
      {
        airports: dataset.airports.length,
        origins: originCount,
        routes: dataset.routeCount,
        observedOrigins: overlay?.origins ?? 0,
        CAG: sample("CAG"),
        FCO: sample("FCO"),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
