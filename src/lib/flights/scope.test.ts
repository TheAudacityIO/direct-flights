import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterByScope, scopeCounts } from "./scope.ts";
import type { Destination } from "./types.ts";

function destination(iata: string, country: string): Destination {
  return {
    iata,
    name: `${iata} Airport`,
    city: iata,
    country,
    lat: 0,
    lon: 0,
    km: 100,
    minutes: 60,
    airlines: [],
  };
}

const origin = { country: "Italy" };

describe("scopeCounts", () => {
  it("counts all, domestic, and international destinations", () => {
    const destinations = [
      destination("FCO", "Italy"),
      destination("MAD", "Spain"),
      destination("BER", "Germany"),
      destination("VCE", "Italy"),
    ];
    assert.deepEqual(scopeCounts(origin, destinations), {
      all: 4,
      domestic: 2,
      international: 2,
    });
  });

  it("returns zero counts for an empty list", () => {
    assert.deepEqual(scopeCounts(origin, []), { all: 0, domestic: 0, international: 0 });
  });
});

describe("filterByScope", () => {
  const destinations = [
    destination("FCO", "Italy"),
    destination("MAD", "Spain"),
    destination("BER", "Germany"),
    destination("VCE", "Italy"),
  ];

  it("keeps domestic destinations in their original order", () => {
    const result = filterByScope(origin, destinations, "domestic");
    assert.deepEqual(result.map((d) => d.iata), ["FCO", "VCE"]);
  });

  it("keeps international destinations in their original order", () => {
    const result = filterByScope(origin, destinations, "international");
    assert.deepEqual(result.map((d) => d.iata), ["MAD", "BER"]);
  });

  it("returns the same array instance for all destinations", () => {
    const result = filterByScope(origin, destinations, "all");
    assert.equal(result, destinations);
  });
});
