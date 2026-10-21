import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  airportCrumbs,
  airportGlance,
  airportPageDescription,
  airlinesByRoutes,
  airportLastmod,
  airportPageJsonLd,
  airportPagePath,
  airportPageTitle,
  ARCHIVE_LASTMOD,
  archiveAirportPageDescription,
  archiveAirportPageTitle,
  bookableObserved,
  breadcrumbJsonLd,
  buildSitemap,
  countryCrumbs,
  countryPagePath,
  countrySlug,
  datasetSitemapEntries,
  isAirportIndexable,
  isCountryIndexable,
  jsonLdScript,
  nearbyAirports,
  observedSentence,
  provenanceSentence,
  websiteJsonLd,
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
      "Rome direct flights: 118 nonstop destinations from FCO",
    );
    assert.equal(airportPageTitle(FCO, 1), "Rome direct flights: 1 nonstop destination from FCO");
  });

  it("describes with country count and farthest cities", () => {
    const text = airportPageDescription(FCO, [
      dest({}),
      dest({ iata: "CAG", city: "Cagliari", country: "Italy", km: 400 }),
    ]);
    assert.equal(
      text,
      "Rome airport destinations: 2 nonstop flights from Rome Fiumicino (FCO), Italy, to 2 countries on 1 airline, as far as New York, Cagliari.",
    );
  });

  it("ranks airlines by how many nonstop destinations they fly", () => {
    assert.deepEqual(
      airlinesByRoutes([
        dest({ airlines: ["ITA Airways", "Delta"] }),
        dest({ iata: "CAG", airlines: ["ITA Airways", "Ryanair"] }),
        dest({ iata: "BCN", airlines: ["Ryanair", "ITA Airways"] }),
      ]),
      [
        { airline: "ITA Airways", routes: 3 },
        { airline: "Ryanair", routes: 2 },
        { airline: "Delta", routes: 1 },
      ],
    );
  });

  it("states observed vs archive provenance", () => {
    const meta = { windowFrom: "2026-08-11", windowTo: "2026-09-10" };
    assert.match(provenanceSentence([dest({ lastSeen: "2026-09-01" })], meta), /2026-08-11/);
    assert.match(provenanceSentence([dest({})], meta), /OpenFlights archive/);
  });

  it("emits one sitemap url per entry with its own lastmod day", () => {
    const xml = buildSitemap([
      { path: "/", lastmod: "2026-09-11T10:00:00.000Z" },
      { path: "/from/FCO", lastmod: "2026-09-22" },
    ]);
    assert.match(xml, /<loc>https:\/\/flydirectfrom\.com\/from\/FCO<\/loc><lastmod>2026-09-22<\/lastmod>/);
    assert.equal((xml.match(/<url>/g) ?? []).length, 2);
    assert.match(xml, /<lastmod>2026-09-11<\/lastmod>/);
  });

  it("titles and describes archive-only airports as historical", () => {
    assert.equal(archiveAirportPageTitle(FCO, 12), "Rome direct flights from FCO: 12 routes (historical data)");
    assert.equal(archiveAirportPageTitle(FCO, 1), "Rome direct flights from FCO: 1 route (historical data)");
    const text = archiveAirportPageDescription(FCO, [
      dest({}),
      dest({ iata: "CAG", city: "Cagliari", country: "Italy", km: 400 }),
    ]);
    assert.equal(
      text,
      "Historical list of nonstop routes from Rome Fiumicino (FCO), Italy: 2 destinations in 2 countries, as far as New York, Cagliari.",
    );
    assert.ok(text.length <= 155);
  });

  it("drops the farthest cities when the description would run past 155 characters", () => {
    const ap = { iata: "XXX", name: "Very Long International Airport Name", city: "Somewhere", country: "Democratic Republic of Somewhere" };
    const text = archiveAirportPageDescription(ap, [dest({ city: "An Extremely Long Destination City Name" }), dest({ iata: "CAG", city: "Another Long Destination City" })]);
    assert.ok(text.length <= 155, text);
    assert.doesNotMatch(text, /as far as/);
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

describe("structured data", () => {
  it("wraps json-ld as a data script with the schema.org context", () => {
    const tag = jsonLdScript({ "@type": "Thing", name: "x" });
    assert.equal(tag.type, "application/ld+json");
    assert.deepEqual(JSON.parse(tag.children), {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "x",
    });
  });

  it("escapes < so data can never close the script tag", () => {
    const tag = jsonLdScript({ name: "</script><b>" });
    assert.doesNotMatch(tag.children, /<\/script>/);
    assert.equal(JSON.parse(tag.children).name, "</script><b>");
  });

  it("builds the airport breadcrumb trail with absolute urls", () => {
    const ld = breadcrumbJsonLd(airportCrumbs(FCO)) as {
      itemListElement: Array<{ position: number; name: string; item: string }>;
    };
    assert.deepEqual(
      ld.itemListElement.map((i) => [i.position, i.name, i.item]),
      [
        [1, "FlyDirectFrom", "https://flydirectfrom.com/"],
        [2, "Airports", "https://flydirectfrom.com/from"],
        [3, "Italy", "https://flydirectfrom.com/countries/italy"],
        [4, "Rome (FCO)", "https://flydirectfrom.com/from/FCO"],
      ],
    );
    assert.equal(countryCrumbs("Italy").length, 3);
  });

  it("describes the airport page as a WebPage about a schema.org Airport", () => {
    const ld = airportPageJsonLd({ ...FCO, lat: 41.8, lon: 12.24 }, "Rome direct flights", "2026-10-16") as Record<string, any>;
    assert.equal(ld["@type"], "WebPage");
    assert.equal(ld.name, "Rome direct flights");
    assert.equal(ld.dateModified, "2026-10-16");
    assert.equal(ld.url, "https://flydirectfrom.com/from/FCO");
    assert.equal(ld.about.iataCode, "FCO");
    assert.equal(ld.about.geo.latitude, 41.8);
    assert.equal(ld.isPartOf["@id"], (websiteJsonLd() as Record<string, string>)["@id"]);
  });
});

describe("index rule", () => {
  const observed = new Set(["BOS", "CAG"]);
  const keep = { airports: ["BJV"], countries: ["turkey"] };

  it("indexes observed airports and airports with impressions, nothing else", () => {
    assert.equal(isAirportIndexable("BOS", observed, keep), true);
    assert.equal(isAirportIndexable("BJV", observed, keep), true);
    assert.equal(isAirportIndexable("ZZZ", observed, keep), false);
  });

  it("indexes countries with impressions or an observed origin", () => {
    assert.equal(isCountryIndexable("turkey", ["BJV"], observed, keep), true);
    assert.equal(isCountryIndexable("italy", ["FCO", "CAG"], observed, keep), true);
    assert.equal(isCountryIndexable("chad", ["NDJ"], observed, keep), false);
  });

  it("dates observed pages by the window end and archive pages by the last cleanup", () => {
    assert.equal(airportLastmod(true, { windowTo: "2026-10-16" }), "2026-10-16");
    assert.equal(airportLastmod(false, { windowTo: "2026-10-16" }), ARCHIVE_LASTMOD);
    assert.equal(airportLastmod(true, {}), ARCHIVE_LASTMOD);
  });

  it("lists static pages and indexable pages only, each with a truthful lastmod", () => {
    const ap = (iata: string, country: string, destinations = 3) => ({ iata, country, destinations });
    const entries = datasetSitemapEntries(
      [ap("BOS", "United States"), ap("BJV", "Turkey"), ap("NDJ", "Chad"), ap("XXX", "Chad", 0), ap("ZZZ", "Turkey")],
      { generatedAt: "2026-10-16T10:44:08.754Z", windowTo: "2026-10-16", observedOriginCodes: ["BOS"] },
      keep,
    );
    assert.deepEqual(
      entries.filter((e) => !["/", "/from", "/about-the-data", "/privacy", "/blog"].includes(e.path)),
      [
        { path: "/countries/turkey", lastmod: ARCHIVE_LASTMOD },
        { path: "/countries/united-states", lastmod: "2026-10-16" },
        { path: "/from/BJV", lastmod: ARCHIVE_LASTMOD },
        { path: "/from/BOS", lastmod: "2026-10-16" },
      ],
    );
    assert.equal(entries[0].lastmod, "2026-10-16T10:44:08.754Z");
    assert.equal(entries.length, 9);
  });
});

describe("observed counting", () => {
  const BOS = { iata: "BOS", name: "General Edward Lawrence Logan International Airport", city: "Boston" };
  const rows = [
    dest({ iata: "JFK", lastSeen: "2026-10-15", airlines: ["Delta Air Lines", "JetBlue Airways"] }),
    dest({ iata: "LHR", lastSeen: "2026-10-15", airlines: ["British Airways", "NetJets Aviation"] }),
    dest({ iata: "HPN", lastSeen: "2026-10-14", airlines: ["NetJets Aviation", "Flexjet"] }),
    dest({ iata: "ACK", airlines: ["Delta Air Lines"] }),
  ];

  it("keeps bookable observed rows and strips non-scheduled operators from mixed rows", () => {
    const kept = bookableObserved(rows);
    assert.deepEqual(
      kept.map((d) => [d.iata, d.airlines]),
      [
        ["JFK", ["Delta Air Lines", "JetBlue Airways"]],
        ["LHR", ["British Airways"]],
      ],
    );
  });

  it("states the dated answer from bookable observed rows only", () => {
    assert.equal(
      observedSentence(BOS, rows, { windowFrom: "2026-09-16", windowTo: "2026-10-16" }),
      "Between 2026-09-16 and 2026-10-16 we saw 3 airlines fly nonstop from Boston (BOS) to 2 destinations.",
    );
    assert.equal(
      observedSentence(BOS, [rows[0]].map((d) => ({ ...d, airlines: ["Delta Air Lines"] })), {
        windowFrom: "2026-09-16",
        windowTo: "2026-10-16",
      }),
      "Between 2026-09-16 and 2026-10-16 we saw 1 airline fly nonstop from Boston (BOS) to 1 destination.",
    );
  });

  it("has no sentence without a window or bookable rows", () => {
    assert.equal(observedSentence(BOS, rows, {}), null);
    assert.equal(observedSentence(BOS, [rows[2]], { windowFrom: "2026-09-16", windowTo: "2026-10-16" }), null);
  });

  it("feeds the glance stats the same filtered rows", () => {
    const g = airportGlance(bookableObserved(rows));
    assert.equal(g.airlines, 3);
    assert.equal(g.verified, 2);
  });
});
