import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toOperatedRoutes, mergeObserved } from "./overlay.ts";
import { buildObservedDataset } from "./observed.ts";
import type { BuiltDataset } from "./pipeline.ts";
import type { AirportRecord, Destination } from "./types.ts";

const AS_OF = "2026-09-10";
const LOOKBACK = 30;

function airport(iata: string, lat = 39, lon = 9): AirportRecord {
  return {
    id: iata,
    name: `${iata} airport`,
    city: iata,
    country: "Testland",
    iata,
    icao: null,
    lat,
    lon,
    type: "airport",
  };
}

describe("toOperatedRoutes", () => {
  it("maps a route with operators, carrying flightCount on the first leg only", () => {
    const legs = toOperatedRoutes(
      "cag",
      {
        routes: [
          {
            destination: { iata: "DUB" },
            averageDailyFlights: 0.43,
            operators: [{ name: "Ryanair" }, { name: "Aer Lingus" }],
          },
        ],
      },
      AS_OF,
      LOOKBACK,
    );
    assert.equal(legs.length, 2);
    assert.deepEqual(
      legs.map((l) => l.airline),
      ["Aer Lingus", "Ryanair"],
    );
    const total = legs.reduce((s, l) => s + l.flightCount, 0);
    assert.equal(total, Math.round(0.43 * LOOKBACK));
    for (const leg of legs) {
      assert.equal(leg.originIata, "CAG");
      assert.equal(leg.destIata, "DUB");
      assert.equal(leg.lastSeen, AS_OF);
      assert.deepEqual(leg.days, []);
    }
  });

  it("marks a service daily only at or above the threshold", () => {
    const legs = toOperatedRoutes(
      "FCO",
      {
        routes: [
          { destination: { iata: "LIN" }, averageDailyFlights: 3.2, operators: [{ name: "ITA" }] },
          { destination: { iata: "CDG" }, averageDailyFlights: 0.9, operators: [{ name: "ITA" }] },
        ],
      },
      AS_OF,
      LOOKBACK,
    );
    assert.equal(legs.find((l) => l.destIata === "LIN")?.days.length, 7);
    assert.deepEqual(legs.find((l) => l.destIata === "CDG")?.days, []);
  });

  it("drops self-routes, bad destination codes and tolerates missing fields", () => {
    const legs = toOperatedRoutes(
      "CAG",
      {
        routes: [
          { destination: { iata: "CAG" }, averageDailyFlights: 1 },
          { destination: { iata: "X" } },
          { destination: undefined },
          { destination: { iata: "OLB" } },
        ],
      },
      AS_OF,
      LOOKBACK,
    );
    assert.equal(legs.length, 1);
    assert.equal(legs[0].destIata, "OLB");
    assert.equal(legs[0].airline, "");
    assert.equal(legs[0].flightCount, 1);
  });

  it("returns nothing for an empty or unexpected payload", () => {
    assert.deepEqual(toOperatedRoutes("CAG", {}, AS_OF, LOOKBACK), []);
    assert.deepEqual(
      toOperatedRoutes("CAG", { routes: undefined }, AS_OF, LOOKBACK),
      [],
    );
  });
});

describe("mergeObserved", () => {
  function dest(iata: string, minutes: number): Destination {
    return {
      iata,
      name: `${iata} airport`,
      city: iata,
      country: "Testland",
      lat: 39,
      lon: 9,
      km: 500,
      minutes,
      airlines: ["Baseline Air"],
    };
  }

  function baseDataset(): BuiltDataset {
    return {
      airports: [
        { iata: "CAG", name: "CAG airport", city: "CAG", country: "Testland", lat: 39, lon: 9, destinations: 2 },
        { iata: "OLB", name: "OLB airport", city: "OLB", country: "Testland", lat: 40, lon: 9, destinations: 1 },
        { iata: "DUB", name: "DUB airport", city: "DUB", country: "Testland", lat: 53, lon: -6, destinations: 0 },
        { iata: "STN", name: "STN airport", city: "STN", country: "Testland", lat: 51, lon: 0, destinations: 0 },
      ],
      routesByOrigin: new Map([
        ["CAG", [dest("STN", 120), dest("OLB", 40)]],
        ["OLB", [dest("CAG", 40)]],
      ]),
      routeCount: 3,
    };
  }

  function observedDataset(): BuiltDataset {
    return buildObservedDataset(
      [airport("CAG"), airport("DUB", 53, -6)],
      [
        {
          originIata: "CAG",
          destIata: "DUB",
          airline: "Ryanair",
          days: [],
          lastSeen: AS_OF,
          flightCount: 13,
        },
      ],
      { asOf: AS_OF, lookbackDays: LOOKBACK },
    );
  }

  it("replaces covered origins, keeps the long tail, recomputes the index", () => {
    const { merged, replacedOrigins } = mergeObserved(baseDataset(), observedDataset());
    assert.deepEqual(replacedOrigins, ["CAG"]);

    const cag = merged.routesByOrigin.get("CAG")!;
    assert.equal(cag.length, 1);
    assert.equal(cag[0].iata, "DUB");
    assert.deepEqual(cag[0].airlines, ["Ryanair"]);
    assert.equal(cag[0].flightCount, 13);

    assert.equal(merged.routesByOrigin.get("OLB")!.length, 1);
    // CAG->DUB observed mirrors as DUB->CAG (see the next test).
    assert.equal(merged.routeCount, 3);

    const index = new Map(merged.airports.map((a) => [a.iata, a.destinations]));
    assert.equal(index.get("CAG"), 1);
    assert.equal(index.get("OLB"), 1);
    assert.equal(index.get("DUB"), 1);
    assert.equal(index.has("STN"), false);
  });

  it("mirrors an observed leg onto the unobserved destination as its return", () => {
    const { merged } = mergeObserved(baseDataset(), observedDataset());
    const dub = merged.routesByOrigin.get("DUB")!;
    assert.equal(dub.length, 1);
    assert.equal(dub[0].iata, "CAG");
    assert.equal(dub[0].name, "CAG airport");
    assert.deepEqual(dub[0].airlines, ["Ryanair"]);
    assert.equal(dub[0].lastSeen, AS_OF);
    assert.equal(dub[0].flightCount, 13);
  });

  it("replaces the destination's archive row for the observed origin, keeps its others", () => {
    const base = baseDataset();
    base.routesByOrigin.set("DUB", [dest("STN", 70), dest("CAG", 200)]);
    const { merged } = mergeObserved(base, observedDataset());
    const dub = merged.routesByOrigin.get("DUB")!;
    assert.deepEqual(
      dub.map((d) => [d.iata, d.airlines[0], Boolean(d.lastSeen)]),
      [
        ["STN", "Baseline Air", false],
        ["CAG", "Ryanair", true],
      ],
    );
  });

  it("never mirrors onto an origin that is itself observed", () => {
    const observed = buildObservedDataset(
      [airport("CAG"), airport("DUB", 53, -6), airport("STN", 51, 0)],
      [
        { originIata: "CAG", destIata: "DUB", airline: "Ryanair", days: [], lastSeen: AS_OF, flightCount: 13 },
        { originIata: "DUB", destIata: "STN", airline: "Ryanair", days: [], lastSeen: AS_OF, flightCount: 5 },
      ],
      { asOf: AS_OF, lookbackDays: LOOKBACK },
    );
    const { merged } = mergeObserved(baseDataset(), observed);
    // DUB's own observed list (STN only) is authoritative: no CAG mirrored in.
    assert.deepEqual(merged.routesByOrigin.get("DUB")!.map((d) => d.iata), ["STN"]);
    // STN was not observed and gains the return leg.
    assert.deepEqual(merged.routesByOrigin.get("STN")!.map((d) => d.iata), ["DUB"]);
  });

  it("keeps the baseline when the observed origin produced no routes", () => {
    const empty: BuiltDataset = { airports: [], routesByOrigin: new Map([["CAG", []]]), routeCount: 0 };
    const { merged, replacedOrigins } = mergeObserved(baseDataset(), empty);
    assert.deepEqual(replacedOrigins, []);
    assert.equal(merged.routesByOrigin.get("CAG")!.length, 2);
  });
});
