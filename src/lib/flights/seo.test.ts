import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  airportGlance,
  airportPageDescription,
  airportPagePath,
  airportPageTitle,
  buildSitemap,
  countryPagePath,
  countrySlug,
  nearbyAirports,
  provenanceSentence,
} from "./seo.ts";
import type { Destination } from "./types.ts";

const FCO = { iata: "FCO", name: "Fiumicino", city: "Rome", country: "Italy" };
const dest = (over: Partial<Destination>): Destination => ({
  iata: "JFK",
  name: "John F Kennedy Intl",
  city: "New York",
  country: "United States",
  lat: 40.6,
  lon: -73.8,
  km: 6900,
  minutes: 517,
  airlines: ["Delta Air Lines"],
  ...over,
});

describe("airport page seo", () => {
  it("uppercases the page path", () => {
    assert.equal(airportPagePath("fco"), "/from/FCO");
  });

  it("titles with the count and pluralises", () => {
    assert.equal(
      airportPageTitle(FCO, 118),
      "Direct flights from Rome (FCO): 118 nonstop destinations",
    );
    assert.equal(airportPageTitle(FCO, 1), "Direct flights from Rome (FCO): 1 nonstop destination");
  });

  it("describes with country count and farthest cities", () => {
    const text = airportPageDescription(FCO, [
      dest({}),
      dest({ iata: "CAG", city: "Cagliari", country: "Italy", km: 400 }),
    ]);
    assert.equal(
      text,
      "Where can you fly direct from Rome Fiumicino (FCO), Italy? 2 nonstop destinations in 2 countries, as far as New York, Cagliari.",
    );
  });

  it("states observed vs archive provenance", () => {
    const meta = { windowFrom: "2026-08-11", windowTo: "2026-09-10" };
    assert.match(provenanceSentence([dest({ lastSeen: "2026-09-01" })], meta), /2026-08-11/);
    assert.match(provenanceSentence([dest({})], meta), /OpenFlights archive/);
  });

  it("emits one sitemap url per path", () => {
    const xml = buildSitemap(["/", "/from/FCO"], "2026-09-11T10:00:00.000Z");
    assert.match(xml, /<loc>https:\/\/flydirectfrom\.com\/from\/FCO<\/loc>/);
    assert.equal((xml.match(/<url>/g) ?? []).length, 2);
    assert.match(xml, /<lastmod>2026-09-11<\/lastmod>/);
  });
});

describe("country and neighbourhood helpers", () => {
  it("slugs country names to ascii kebab-case", () => {
    assert.equal(countrySlug("Congo (Kinshasa)"), "congo-kinshasa");
    assert.equal(countrySlug("Côte d'Ivoire"), "cote-d-ivoire");
    assert.equal(countryPagePath("United States"), "/countries/united-states");
  });

  it("lists the nearest other origins within range, nearest first", () => {
    const ap = (iata: string, lat: number, lon: number, destinations = 5) => ({
      iata,
      name: iata,
      city: iata,
      country: "Italy",
      lat,
      lon,
      destinations,
    });
    const fco = ap("FCO", 41.8, 12.24);
    const near = nearbyAirports(fco, [
      fco,
      ap("CIA", 41.8, 12.6),
      ap("NAP", 40.88, 14.29),
      ap("LHR", 51.47, -0.46),
      ap("XXX", 41.9, 12.3, 0),
    ]);
    assert.deepEqual(
      near.map((a) => a.iata),
      ["CIA", "NAP"],
    );
    assert.ok(near[0].km < near[1].km);
  });

  it("summarises a destination list", () => {
    const g = airportGlance([
      dest({ iata: "JFK", km: 6900, lastSeen: "2026-09-10" }),
      dest({ iata: "CAG", km: 400, country: "Italy", airlines: ["ITA Airways", "Ryanair"] }),
    ]);
    assert.equal(g.countries, 2);
    assert.equal(g.airlines, 3);
    assert.equal(g.verified, 1);
    assert.equal(g.longest?.iata, "JFK");
    assert.equal(g.shortest?.iata, "CAG");
  });
});
