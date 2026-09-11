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

export function brandedAirline(operator: string): string {
  const brand = MARKETING_BRAND[operator];
  return brand ? `${brand} (operated by ${operator})` : operator;
}
