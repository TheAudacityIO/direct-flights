/** Domestic routes stay in the origin's country; international routes leave it. */
import type { AirportIndex, Destination } from "./types";

export type Scope = "all" | "domestic" | "international";

export function scopeCounts(
  origin: Pick<AirportIndex, "country">,
  destinations: Destination[],
): { all: number; domestic: number; international: number } {
  let domestic = 0;
  for (const destination of destinations) {
    if (destination.country === origin.country) domestic += 1;
  }
  return {
    all: destinations.length,
    domestic,
    international: destinations.length - domestic,
  };
}

export function filterByScope(
  origin: Pick<AirportIndex, "country">,
  destinations: Destination[],
  scope: Scope,
): Destination[] {
  if (scope === "all") return destinations;
  const domestic = scope === "domestic";
  return destinations.filter(
    (destination) => (destination.country === origin.country) === domestic,
  );
}
