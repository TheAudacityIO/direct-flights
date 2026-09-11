import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildObservedDataset,
  formatDays,
  windowFrom,
  type OperatedRoute,
} from "./observed.ts";
import type { AirportRecord } from "./types.ts";

const AIRPORTS: AirportRecord[] = [
  {
    id: "cag",
    name: "Cagliari Elmas Airport",
    city: "Cagliari",
    country: "Italy",
    iata: "CAG",
    icao: "LIEE",
    lat: 39.251499,
    lon: 9.05428,
    type: "airport",
  },
  {
    id: "dub",
    name: "Dublin Airport",
    city: "Dublin",
    country: "Ireland",
    iata: "DUB",
    icao: "EIDW",
    lat: 53.421333,
    lon: -6.270075,
    type: "airport",
  },
  {
    id: "fco",
    name: "Fiumicino",
    city: "Rome",
    country: "Italy",
    iata: "FCO",
    icao: "LIRF",
    lat: 41.8002778,
    lon: 12.2388889,
    type: "airport",
  },
];

function route(partial: Partial<OperatedRoute> & Pick<OperatedRoute, "destIata">): OperatedRoute {
  return {
    originIata: "CAG",
    airline: "Ryanair",
    days: ["sat"],
    lastSeen: "2026-08-20",
    flightCount: 12,
    ...partial,
  };
}

describe("windowFrom", () => {
  it("is lookbackDays before asOf, inclusive span", () => {
    assert.equal(windowFrom("2026-08-23", 365), "2025-08-23");
    assert.equal(windowFrom("2026-03-01", 1), "2026-02-28");
  });
});

describe("formatDays", () => {
  it("calls a 7-day set Daily", () => {
    assert.equal(formatDays(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]), "Daily");
  });

  it("keeps a Saturday-only service as Sat, not dropped", () => {
    assert.equal(formatDays(["sat"]), "Sat");
  });

  it("is empty when days are unknown", () => {
    assert.equal(formatDays([]), "");
    assert.equal(formatDays(undefined), "");
  });
});

describe("buildObservedDataset", () => {
  const asOf = "2026-08-23";
  const lookbackDays = 365;

  it("includes a Saturday-only CAG–DUB that last operated inside the lookback", () => {
    const built = buildObservedDataset(AIRPORTS, [route({ destIata: "DUB" })], {
      asOf,
      lookbackDays,
    });
    const cag = built.routesByOrigin.get("CAG");
    assert.ok(cag);
    const dub = cag.find((d) => d.iata === "DUB");
    assert.ok(dub, "weekly Ryanair CAG–DUB must appear");
    assert.deepEqual(dub.airlines, ["Ryanair"]);
    assert.deepEqual(dub.days, ["sat"]);
    assert.equal(dub.lastSeen, "2026-08-20");
    assert.equal(dub.flightCount, 12);
    assert.equal(built.routeCount, 1);
  });

  it("carries the booked brand for a wet-lease operator and discloses it", () => {
    const built = buildObservedDataset(
      AIRPORTS,
      [route({ destIata: "FCO", airline: "Fly Air41 Airways" })],
      { asOf, lookbackDays },
    );
    const fco = built.routesByOrigin.get("CAG")?.find((d) => d.iata === "FCO");
    assert.ok(fco);
    assert.deepEqual(fco.airlines, ["ITA Airways (operated by Fly Air41 Airways)"]);
  });

  it("drops a pair whose lastSeen is older than the lookback", () => {
    const built = buildObservedDataset(
      AIRPORTS,
      [route({ destIata: "DUB", lastSeen: "2024-06-01", flightCount: 40 })],
      { asOf, lookbackDays },
    );
    assert.equal(built.routesByOrigin.get("CAG"), undefined);
    assert.equal(built.routeCount, 0);
  });

  it("merges airlines and unions days on the same pair", () => {
    const built = buildObservedDataset(
      AIRPORTS,
      [
        route({ destIata: "DUB", airline: "Ryanair", days: ["sat"], flightCount: 12 }),
        route({
          destIata: "DUB",
          airline: "Aer Lingus",
          days: ["wed", "sat"],
          lastSeen: "2026-08-21",
          flightCount: 8,
        }),
        route({ destIata: "FCO", airline: "Ryanair", days: ["mon", "fri"], lastSeen: "2026-08-22" }),
      ],
      { asOf, lookbackDays },
    );
    const cag = built.routesByOrigin.get("CAG")!;
    const dub = cag.find((d) => d.iata === "DUB")!;
    assert.deepEqual(dub.airlines, ["Aer Lingus", "Ryanair"]);
    assert.deepEqual(dub.days, ["wed", "sat"]);
    assert.equal(dub.lastSeen, "2026-08-21");
    assert.equal(dub.flightCount, 20);
    assert.equal(cag.length, 2);
  });

  it("does not require daily frequency", () => {
    const built = buildObservedDataset(
      AIRPORTS,
      [route({ destIata: "DUB", days: ["sat"], flightCount: 1 })],
      { asOf, lookbackDays },
    );
    assert.equal(built.routesByOrigin.get("CAG")?.[0]?.iata, "DUB");
  });
});
