import type { AirportIndex, DatasetMeta, RouteFile } from "./types.ts";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (res.status === 404) {
    const err = new Error(`Not found: ${url}`);
    err.name = "NotFoundError";
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (${res.status})`);
  }
  return (await res.json()) as T;
}

export function loadAirports(): Promise<AirportIndex[]> {
  return getJson<AirportIndex[]>("/data/airports.json");
}

export function loadMeta(): Promise<DatasetMeta> {
  return getJson<DatasetMeta>("/data/meta.json");
}

export async function loadRoutes(iata: string): Promise<RouteFile> {
  const code = iata.toUpperCase();
  try {
    return await getJson<RouteFile>(`/data/routes/${code}.json`);
  } catch (err) {
    if (err instanceof Error && err.name === "NotFoundError") {
      return { origin: code, destinations: [] };
    }
    throw err;
  }
}
