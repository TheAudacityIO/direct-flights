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

  const built = buildDataset(
    parseAirports(airportsDat),
    parseAirlines(airlinesDat),
    parseRoutes(routesDat),
  );

  const routesDir = path.join(OUT, "routes");
  await rm(routesDir, { recursive: true, force: true });
  await mkdir(routesDir, { recursive: true });

  await writeFile(path.join(OUT, "airports.json"), JSON.stringify(built.airports));

  const writes: Promise<void>[] = [];
  for (const [iata, destinations] of built.routesByOrigin) {
    writes.push(
      writeFile(
        path.join(routesDir, `${iata}.json`),
        JSON.stringify({ origin: iata, destinations }),
      ),
    );
  }
  await Promise.all(writes);

  const originCount = built.routesByOrigin.size;
  const meta = {
    source: "OpenFlights",
    attribution:
      "Airport and route data © OpenFlights.org (https://openflights.org/data.html)",
    generatedAt: new Date().toISOString(),
    airportCount: built.airports.length,
    originCount,
    routeCount: built.routeCount,
    note: "Historical OpenFlights dump (~2014 schedules). Not a live timetable.",
  };
  await writeFile(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2));

  const sample = (code: string) => built.routesByOrigin.get(code)?.length ?? 0;
  console.log(
    JSON.stringify(
      {
        airports: built.airports.length,
        origins: originCount,
        routes: built.routeCount,
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
