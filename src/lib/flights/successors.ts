/**
 * OpenFlights airline names (airlines.dat column 2) that the ~2014 dump
 * still uses for a route a living carrier flies today, mapped to the name a
 * traveller books under. Two kinds: brands absorbed by a successor after a
 * merger (the successor kept the routes), and carriers the dump names by an
 * old or verbose legal name. Bankruptcies belong in defunct.ts, not here.
 */
export const AIRLINE_SUCCESSORS: Readonly<Record<string, string>> = {
  // Mergers: the successor inherited the network.
  "US Airways": "American Airlines", // 2015
  "Virgin America": "Alaska Airlines", // 2018
  "AirTran Airways": "Southwest Airlines", // 2014
  Germanwings: "Eurowings", // 2020
  "Virgin Express": "Brussels Airlines", // 2006
  "TAM Brazilian Airlines": "LATAM Airlines Brasil", // 2016
  "LAN Airlines": "LATAM Airlines", // 2016
  Thomsonfly: "TUI Airways", // 2017
  TUIfly: "TUI fly", // 2007 brand
  "Tiger Airways": "Scoot", // 2017
  SilkAir: "Singapore Airlines", // 2021
  Dragonair: "Cathay Pacific", // 2020
  "Japan Air System": "Japan Airlines", // 2004
  Airlinair: "Air France Hop", // 2013
  // Renames and legal names.
  "Aeroflot Russian Airlines": "Aeroflot",
  "Scandinavian Airlines System": "SAS",
  "Saudi Arabian Airlines": "Saudia",
  "KLM Royal Dutch Airlines": "KLM",
  "Iberia Airlines": "Iberia",
  "TAP Portugal": "TAP Air Portugal",
  "Air India Limited": "Air India",
  "VOLOTEA Airways": "Volotea",
  "Fly Dubai": "flydubai",
  "IndiGo Airlines": "IndiGo",
  Spicejet: "SpiceJet",
  "Avianca - Aerovias Nacionales de Colombia": "Avianca",
  "Norwegian Air Shuttle": "Norwegian",
  "Condor Flugdienst": "Condor",
  "Lion Mentari Airlines": "Lion Air",
  "Swiss International Air Lines": "SWISS",
  "Transavia Holland": "Transavia",
  "Nas Air": "flynas",
  "China SSS": "Spring Airlines",
  Corsairfly: "Corsair",
  "Virgin Atlantic Airways": "Virgin Atlantic",
  "Jet2.com": "Jet2",
};

export function successorAirline(name: string): string {
  return AIRLINE_SUCCESSORS[name] ?? name;
}
