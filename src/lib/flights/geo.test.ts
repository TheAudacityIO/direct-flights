import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateDurationMin,
  formatDuration,
  greatCircleCoords,
  haversineKm,
  splitAntimeridian,
} from "./geo.ts";

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    const p = { lat: 41.8, lon: 12.25 };
    assert.equal(haversineKm(p, p), 0);
  });

  it("is symmetric", () => {
    const a = { lat: 41.8002778, lon: 12.2388889 };
    const b = { lat: 40.639801, lon: -73.7789 };
    assert.equal(haversineKm(a, b), haversineKm(b, a));
  });

  it("matches a known FCO–JFK distance within 30 km", () => {
    const fco = { lat: 41.8002778, lon: 12.2388889 };
    const jfk = { lat: 40.639801, lon: -73.7789 };
    const km = haversineKm(fco, jfk);
    // Great-circle Rome Fiumicino → JFK is ~6,870 km
    assert.ok(km > 6700 && km < 7100, `got ${km}`);
  });
});

describe("duration estimate", () => {
  it("is distance / 850 km/h + 30 min, rounded", () => {
    assert.equal(estimateDurationMin(850), 90);
    assert.equal(estimateDurationMin(0), 30);
    assert.equal(estimateDurationMin(425), 60);
  });

  it("formats as h:mm", () => {
    assert.equal(formatDuration(45), "0:45");
    assert.equal(formatDuration(90), "1:30");
    assert.equal(formatDuration(516), "8:36");
    assert.equal(formatDuration(0), "0:00");
  });
});

describe("greatCircleCoords", () => {
  it("starts at origin and ends at destination", () => {
    const a = { lat: 0, lon: 0 };
    const b = { lat: 0, lon: 10 };
    const coords = greatCircleCoords(a, b, 8);
    assert.equal(coords.length, 9);
    assert.equal(coords[0][0], 0);
    assert.equal(coords[0][1], 0);
    assert.ok(Math.abs(coords.at(-1)![0] - 10) < 1e-6);
    assert.ok(Math.abs(coords.at(-1)![1] - 0) < 1e-6);
  });
});

describe("splitAntimeridian", () => {
  it("splits a jump greater than 180° of longitude", () => {
    const coords: [number, number][] = [
      [170, 0],
      [175, 0],
      [-175, 0],
      [-170, 0],
    ];
    const parts = splitAntimeridian(coords);
    assert.equal(parts.length, 2);
    assert.deepEqual(parts[0], [
      [170, 0],
      [175, 0],
    ]);
    assert.deepEqual(parts[1], [
      [-175, 0],
      [-170, 0],
    ]);
  });

  it("keeps a normal arc as a single part", () => {
    const parts = splitAntimeridian([
      [12, 41],
      [0, 45],
      [-5, 50],
    ]);
    assert.equal(parts.length, 1);
    assert.equal(parts[0].length, 3);
  });
});
