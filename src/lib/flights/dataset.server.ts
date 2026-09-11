/**
 * Server-side reader for the static dataset under public/data. The node
 * server build copies public/ to .output/public, so the same relative
 * lookup works in dev (public/data) and in the image (.output/public/data).
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { AirportIndex, DatasetMeta, RouteFile } from "./types.ts";

const CANDIDATES = [".output/public/data", "public/data"];

function dataDir(): string {
  for (const rel of CANDIDATES) {
    const dir = path.resolve(process.cwd(), rel);
    if (existsSync(path.join(dir, "meta.json"))) return dir;
  }
  throw new Error("public/data not found; run `npm run data:build`");
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(dataDir(), file), "utf8")) as T;
}

let airports: Promise<AirportIndex[]> | null = null;
let meta: Promise<DatasetMeta> | null = null;

export function readAirports(): Promise<AirportIndex[]> {
  airports ??= readJson<AirportIndex[]>("airports.json");
  return airports;
}

export function readMeta(): Promise<DatasetMeta> {
  meta ??= readJson<DatasetMeta>("meta.json");
  return meta;
}

export async function readRoutes(iata: string): Promise<RouteFile | null> {
  if (!/^[A-Z]{3}$/.test(iata)) return null;
  try {
    return await readJson<RouteFile>(`routes/${iata}.json`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
