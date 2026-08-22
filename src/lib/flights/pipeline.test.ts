import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCsvLine, isMissing } from "./csv.ts";
import { parseAirports, parseAirlines, parseRoutes, buildDataset } from "./pipeline.ts";
import { searchAirports } from "./search.ts";

describe("parseCsvLine", () => {
  it("splits plain fields", () => {
    assert.deepEqual(parseCsvLine("a,b,c"), ["a", "b", "c"]);
  });

  it("keeps commas inside quotes and unescapes doubled quotes", () => {
    assert.deepEqual(parseCsvLine('"Leonardo da Vinci, Fiumicino","Rome","Italy"'), [
      "Leonardo da Vinci, Fiumicino",
      "Rome",
      "Italy",
    ]);
    assert.deepEqual(parseCsvLine('"He said ""hi""",x'), ['He said "hi"', "x"]);
  });
});

describe("isMissing", () => {
  it("treats OpenFlights sentinels as missing", () => {
    assert.equal(isMissing("\\N"), true);
    assert.equal(isMissing("N/A"), true);
    assert.equal(isMissing("  "), true);
    assert.equal(isMissing("FCO"), false);
  });
});

const AIRPORTS_DAT = `
1555,"Fiumicino","Rome","Italy","FCO","LIRF",41.8002778,12.2388889,15,1,"E","Europe/Rome","airport","OurAirports"
1556,"Ciampino","Rome","Italy","CIA","LIRA",41.7994,12.5949,427,1,"E","Europe/Rome","airport","OurAirports"
2990,"Kazan","Kazan","Russia","KZN","UWKD",55.6062,49.2787,411,3,"N","Europe/Moscow","airport","OurAirports"
9999,"No Code","Nowhere","None","\\N","XXXX",10,10,0,0,"U","UTC","airport","OurAirports"
8888,"Null Island","Sea","None","ZZZ","ZZZZ",0,0,0,0,"U","UTC","airport","OurAirports"
7777,"Roma Termini","Rome","Italy","XRJ","\\N",41.9,12.5,50,1,"E","Europe/Rome","station","OurAirports"
1554,"Cagliari Elmas","Cagliari","Italy","CAG","LIEE",39.251499,9.05428,13,1,"E","Europe/Rome","airport","OurAirports"
3797,"John F Kennedy Intl","New York","United States","JFK","KJFK",40.639801,-73.7789,13,-5,"A","America/New_York","airport","OurAirports"
`.trim();

const AIRLINES_DAT = `
1,"Alitalia",\\N,"AZ","AZA","ALITALIA","Italy","Y"
2,"Delta Air Lines",\\N,"DL","DAL","DELTA","United States","Y"
3,"Codeshare Air",\\N,"CS","CSA","CSHARE","Italy","Y"
`.trim();

const ROUTES_DAT = `
AZ,1,FCO,1555,JFK,3797,,0,772
AZ,1,FCO,1555,JFK,3797,,0,772
DL,2,FCO,1555,JFK,3797,,0,772
CS,3,FCO,1555,JFK,3797,Y,0,772
AZ,1,FCO,1555,CAG,1554,,0,319
AZ,1,FCO,1555,CIA,1556,,1,319
AZ,1,CAG,1554,FCO,1555,,0,319
2B,410,AER,2965,KZN,2990,,0,CR2
`.trim();

describe("parse + clean pipeline", () => {
  it("drops airports missing IATA, coords, or non-airport types still parseable", () => {
    const airports = parseAirports(AIRPORTS_DAT);
    const iatas = airports.map((a) => a.iata);
    assert.ok(iatas.includes("FCO"));
    assert.ok(iatas.includes("CAG"));
    assert.equal(
      airports.find((a) => a.name === "Null Island"),
      undefined,
    );
    assert.equal(
      airports.find((a) => a.type === "station"),
      undefined,
    );
  });

  it("drops codeshares, multi-stop, unknown endpoints, and duplicate airline legs", () => {
    const airports = parseAirports(AIRPORTS_DAT);
    const airlines = parseAirlines(AIRLINES_DAT);
    const routes = parseRoutes(ROUTES_DAT);
    const built = buildDataset(airports, airlines, routes);

    const fco = built.routesByOrigin.get("FCO");
    assert.ok(fco);
    const destIatas = fco.map((d) => d.iata).sort();
    assert.deepEqual(destIatas, ["CAG", "JFK"]);

    const jfk = fco.find((d) => d.iata === "JFK");
    assert.ok(jfk);
    assert.deepEqual(jfk.airlines, ["Alitalia", "Delta Air Lines"]);
    assert.ok(jfk.km > 6700 && jfk.km < 7100);
    assert.equal(jfk.minutes, Math.round((jfk.km / 850) * 60 + 30));
    assert.ok(!jfk.airlines.includes("Codeshare Air"));

    const cag = built.routesByOrigin.get("CAG");
    assert.ok(cag);
    assert.equal(cag.length, 1);
    assert.equal(cag[0].iata, "FCO");

    const fcoIndex = built.airports.find((a) => a.iata === "FCO");
    assert.equal(fcoIndex?.destinations, 2);
  });

  it("sorts destinations by estimated duration", () => {
    const airports = parseAirports(AIRPORTS_DAT);
    const airlines = parseAirlines(AIRLINES_DAT);
    const routes = parseRoutes(ROUTES_DAT);
    const built = buildDataset(airports, airlines, routes);
    const fco = built.routesByOrigin.get("FCO")!;
    const minutes = fco.map((d) => d.minutes);
    assert.deepEqual(
      minutes,
      [...minutes].sort((a, b) => a - b),
    );
    assert.equal(fco[0].iata, "CAG");
  });
});

describe("searchAirports", () => {
  const airports = parseAirports(AIRPORTS_DAT);
  const airlines = parseAirlines(AIRLINES_DAT);
  const built = buildDataset(airports, airlines, parseRoutes(ROUTES_DAT));

  it("ranks exact IATA first", () => {
    const hits = searchAirports(built.airports, "cag");
    assert.equal(hits[0]?.iata, "CAG");
  });

  it("matches city names", () => {
    const hits = searchAirports(built.airports, "rome");
    assert.ok(hits.some((h) => h.iata === "FCO"));
  });

  it("returns nothing for empty query", () => {
    assert.deepEqual(searchAirports(built.airports, "  "), []);
  });
});
