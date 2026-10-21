import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchOrder, mergeObserved, mergeObservedRun, toOperatedRoutes } from "./overlay.ts";
import { buildObservedDataset, type OperatedRoute } from "./observed.ts";
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

function leg(originIata: string, destIata: string, lastSeen: string): OperatedRoute {
  return { originIata, destIata, airline: "Ryanair", days: [], lastSeen, flightCount: 1 };
}

describe("mergeObservedRun", () => {
  const prev = {
    routes: [leg("CAG", "DUB", "2026-09-05"), leg("CAG", "STN", "2026-09-05"), leg("LHR", "JFK", "2026-09-05")],
    skippedAsOf: { XXX: "2026-09-05", BHX: "2026-09-05" },
  };

  it("replaces only re-fetched origins' rows and keeps the rest with their dates", () => {
    const { routes } = mergeObservedRun(prev, {
      asOf: "2026-10-05",
      routes: [leg("CAG", "BGY", "2026-10-05"), leg("ARN", "CPH", "2026-10-05")],
      fetchedOrigins: ["CAG", "ARN"],
      skippedOrigins: [],
    });
    assert.deepEqual(
      routes.map((r) => `${r.originIata}-${r.destIata}@${r.lastSeen}`),
      ["ARN-CPH@2026-10-05", "CAG-BGY@2026-10-05", "LHR-JFK@2026-09-05"],
    );
  });

  it("keeps earlier rows of an origin that now returned nothing, and stamps the skip", () => {
    const { routes, skippedAsOf } = mergeObservedRun(prev, {
      asOf: "2026-10-05",
      routes: [leg("BHX", "DUB", "2026-10-05")],
      fetchedOrigins: ["BHX"],
      skippedOrigins: ["LHR", "ZZZ"],
    });
    assert.ok(routes.some((r) => r.originIata === "LHR" && r.lastSeen === "2026-09-05"));
    // BHX succeeded, so its old skip stamp goes; XXX keeps its stamp.
    assert.deepEqual(skippedAsOf, { LHR: "2026-10-05", XXX: "2026-09-05", ZZZ: "2026-10-05" });
  });

  it("works from an empty (first-run or legacy) file", () => {
    const res = mergeObservedRun(
      { routes: [] },
      { asOf: "2026-10-05", routes: [leg("CAG", "DUB", "2026-10-05")], fetchedOrigins: ["CAG"], skippedOrigins: [] },
    );
    assert.equal(res.routes.length, 1);
    assert.deepEqual(res.skippedAsOf, {});
  });
});

describe("fetchOrder", () => {
  const ranked = ["LHR", "CDG", "JFK", "FRA", "AMS", "CAG", "BLQ", "FUE"];

  it("canary, then untried candidates by rank, untried rest by rank, then oldest attempts", () => {
    const order = fetchOrder({
      first: ["CAG"],
      candidates: ["FUE", "BLQ", "JFK"],
      ranked,
      observedAsOf: { CAG: "2026-10-05", LHR: "2026-09-05", JFK: "2026-10-05" },
      skippedAsOf: { AMS: "2026-08-05" },
    });
    assert.deepEqual(order, [
      "CAG", // canary
      "BLQ", "FUE", // never tried, with impressions (JFK is already observed)
      "CDG", "FRA", // never tried, by global rank
      "AMS", "LHR", "JFK", // oldest attempt first; CAG already placed
    ]);
  });

  it("puts manual pins right after the canary without repeating them", () => {
    const order = fetchOrder({
      first: ["CAG", "LHR"],
      candidates: ["LHR"],
      ranked,
      observedAsOf: { LHR: "2026-09-05" },
      skippedAsOf: {},
    });
    assert.deepEqual(order.slice(0, 3), ["CAG", "LHR", "CDG"]);
    assert.equal(order.length, ranked.length);
  });

  it("dates a skipped-after-observed origin by its latest attempt", () => {
    const order = fetchOrder({
      first: [],
      candidates: [],
      ranked: ["LHR", "CDG"],
      observedAsOf: { LHR: "2026-08-05", CDG: "2026-09-05" },
      skippedAsOf: { LHR: "2026-10-05" },
    });
    assert.deepEqual(order, ["CDG", "LHR"]);
  });

  it("ranks unknown candidates after ranked ones", () => {
    const order = fetchOrder({
      first: [],
      candidates: ["QQQ", "BLQ"],
      ranked: ["BLQ"],
      observedAsOf: {},
      skippedAsOf: {},
    });
    assert.deepEqual(order, ["BLQ", "QQQ"]);
  });

  it("refreshes observed origins older than 90 days before the unseen queue", () => {
    const order = fetchOrder({
      first: ["CAG"],
      candidates: ["NEW"],
      ranked: ["NEW", "OLD", "FRS"],
      observedAsOf: { CAG: "2026-10-16", OLD: "2026-06-01", FRS: "2026-10-01" },
      skippedAsOf: {},
      today: "2026-11-05",
    });
    assert.deepEqual(order.slice(0, 3), ["CAG", "OLD", "NEW"]);
    assert.equal(order.at(-1), "FRS");
  });
});
