/**
 * Airlines that ceased operations after the ~2014 OpenFlights dump, keyed by
 * the exact display name the dump resolves to (airlines.dat column 2).
 *
 * Bankruptcies and liquidations only: a brand that merged into a living
 * carrier (US Airways, Virgin America, Germanwings) still flew its routes
 * under the successor and stays. Successor companies that reuse a dead name
 * (ITA Airways, Flybe 2022, LIAT 2020) inherited only a subset of routes and
 * are not represented by the old dump, so the old name still goes.
 */
export const DEFUNCT_AIRLINES: ReadonlySet<string> = new Set([
  "Adria Airways", // 2019
  "Aigle Azur", // 2019
  "Air Berlin", // 2017
  "Air Italy", // 2020 (ex-Meridiana)
  "Air Namibia", // 2021
  "Alitalia", // 2021
  "Blue Panorama Airlines", // 2021
  "Estonian Air", // 2015
  "Excel Airways", // 2008 (XL Airways UK; residual rows in the dump)
  "Flybe", // 2020 (2022 relaunch ceased 2023)
  "Germania", // 2019
  "Great Lakes Airlines", // 2018
  "Insel Air (7I/INC) (Priv)", // 2019
  "Interjet (ABC Aerolineas)", // 2020
  "Jet Airways", // 2019
  "Kingfisher Airlines", // 2012
  "Leeward Islands Air Transport", // LIAT, 2024
  "Malév", // 2012
  "Meridiana", // 2018 (became Air Italy)
  "Monarch Airlines", // 2017
  "NextJet", // 2018
  "Niki", // 2017
  "Norwegian Long Haul AS", // 2021
  "Oceanair", // Avianca Brasil, 2019
  "Primera Air", // 2018
  "Small Planet Airlines", // 2018
  "Spanair", // 2012
  "TAME", // 2020
  "Thomas Cook Airlines", // 2019
  "Tiger Airways Australia", // 2020
  "TransAsia Airways", // 2016
  "Transaero Airlines", // 2015
  "XL Airways France", // 2019
]);

export function isDefunctAirline(name: string): boolean {
  return DEFUNCT_AIRLINES.has(name);
}
