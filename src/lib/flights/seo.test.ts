import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  airportPageDescription,
  airportPagePath,
  airportPageTitle,
  buildSitemap,
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
