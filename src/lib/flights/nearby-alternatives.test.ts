import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { driveMinutes, formatDrive, nearbyAlternatives } from "./nearby-alternatives.ts";
import type { Destination } from "./types.ts";

function dest(iata: string, flightCount?: number): Destination {
  return {
    iata,
    name: `${iata} Airport`,
    city: `${iata} City`,
    country: "Testland",
    lat: 0,
    lon: 0,
    km: 500,
    minutes: 65,
    airlines: ["Test Air"],
    ...(flightCount === undefined ? {} : { lastSeen: "2026-10-16", flightCount }),
  };
}

const near = (iata: string, km: number) => ({ iata, name: `${iata} Airport`, city: `${iata} City`, km });

describe("nearbyAlternatives", () => {
  const origin = { iata: "AAA", destinations: [dest("SHR", 30), dest("OWN", 10)], observed: true };

  it("returns observed routes the origin does not fly, busiest first; drops shared and archive rows", () => {
    const out = nearbyAlternatives(origin, [
      {
        airport: near("BBB", 60),
        destinations: [dest("SHR", 90), dest("UNQ", 12), dest("BIG", 40), dest("OLD"), dest("AAA", 50)],
      },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].iata, "BBB");
    assert.equal(out[0].miles, 37);
    assert.equal(out[0].drive, "about 1 h");
    assert.deepEqual(
      out[0].routes.map((r) => [r.iata, r.flightCount]),
      [
        ["BIG", 40],
        ["UNQ", 12],
      ],
    );
  });

  it("drops a nearby airport whose only extra routes are archive rows", () => {
    const out = nearbyAlternatives(origin, [
      { airport: near("CCC", 40), destinations: [dest("SHR", 20), dest("OLD"), dest("OLD2")] },
    ]);
    assert.deepEqual(out, []);
  });

  it("drops airports past the 2 h 30 min drive cap and honors water-crossing overrides", () => {
    const out = nearbyAlternatives(
      origin,
      [
        { airport: near("FAR", 170), destinations: [dest("UNQ", 15)] },
        { airport: near("SEA", 50), destinations: [dest("UNQ", 15)] },
        { airport: near("FRY", 50), destinations: [dest("UNQ", 15)] },
      ],
      { "AAA-SEA": null, "AAA-FRY": "about 1 h by ferry" },
    );
    assert.deepEqual(
      out.map((b) => [b.iata, b.drive]),
      [["FRY", "about 1 h by ferry"]],
    );
  });

  it("returns nothing for an origin without a full observed route list", () => {
    const nb = [{ airport: near("BBB", 60), destinations: [dest("UNQ", 15)] }];
    assert.deepEqual(nearbyAlternatives({ ...origin, observed: false }, nb), []);
    assert.equal(nearbyAlternatives(origin, nb).length, 1);
  });

  it("caps each airport at 8 routes", () => {
    const many = Array.from({ length: 12 }, (_, i) => dest(`X${String.fromCharCode(65 + i)}A`, i + 10));
    const [b] = nearbyAlternatives(origin, [{ airport: near("BBB", 30), destinations: many }]);
    assert.equal(b.routes.length, 8);
    assert.equal(b.routes[0].flightCount, 21);
  });

  it("drops routes under about twice a week (one-off charters)", () => {
    const out = nearbyAlternatives(origin, [
      { airport: near("BBB", 30), destinations: [dest("RAR", 4), dest("REG", 8)] },
    ]);
    assert.deepEqual(
      out[0].routes.map((r) => r.iata),
      ["REG"],
    );
  });
});

describe("drive estimate", () => {
  it("rounds km x 1.3 at 80 km/h to the nearest 15 minutes", () => {
    assert.equal(driveMinutes(5), 15);
    assert.equal(driveMinutes(46), 45);
    assert.equal(driveMinutes(78), 75);
    assert.equal(formatDrive(45), "about 45 min");
    assert.equal(formatDrive(75), "about 1 h 15 min");
    assert.equal(formatDrive(120), "about 2 h");
  });
});

describe("nearbyAlternatives bookability", () => {
  it("drops rows flown only by business-jet or cargo-feeder operators", () => {
    const jet = { ...dest("JET", 26), airlines: ["Ameriflight"] };
    const mixed = { ...dest("MIX", 20), airlines: ["NetJets Aviation", "JetBlue Airways"] };
    const out = nearbyAlternatives({ iata: "AAA", destinations: [dest("OWN", 10)], observed: true }, [
      { airport: near("BBB", 60), destinations: [jet, mixed] },
    ]);
    assert.deepEqual(
      out[0].routes.map((r) => r.iata),
      ["MIX"],
    );
  });
});
