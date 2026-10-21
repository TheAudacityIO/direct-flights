/**
 * Operating carriers that fly exclusively under another airline's brand,
 * keyed by the exact AeroDataBox `operators[].name`. The daily-routes stats
 * endpoint names only the operator, so a wet-lease shows up as a carrier
 * nobody books with. Users search for the brand they book, so rows carry
 * the brand and disclose the operator.
 */
const MARKETING_BRAND: Record<string, string> = {
  "Fly Air41 Airways": "ITA Airways", // Sardinia PSO routes (CAG/OLB/AHO), ITA wet-lease
};

/**
 * Business-jet, fractional, charter-broker and cargo-feeder operators seen in
 * the AeroDataBox overlay (2026-10-16 set). Nobody can buy a seat on them, so
 * a row flown only by these is not a "nonstop you can book". Exact operator names.
 */
export const NON_SCHEDULED_OPERATORS = new Set([
  "NetJets Aviation",
  "Flexjet",
  "PlaneSense",
  "Ameriflight",
  "VJA",
  "VistaJet",
  "WUP",
  "Executive Jet Management",
  "AirSprint",
  "Solarius Aviation",
  "ATI Jet",
  "EAT Leipzig",
  "FFL",
  "KPO",
  "Linear Air",
  "MVP",
  "TCN",
  "Baker Aviation",
  "Executive Fliteways",
  "NetJets Europe",
  "Hop-A-Jet Worldwide Jet Charter",
  "Jet Linx Aviation",
]);

/** True when at least one airline on the row sells seats. */
export function isBookable(airlines: string[]): boolean {
  return airlines.some((a) => !NON_SCHEDULED_OPERATORS.has(a));
}

export function brandedAirline(operator: string): string {
  const brand = MARKETING_BRAND[operator];
  return brand ? `${brand} (operated by ${operator})` : operator;
}
