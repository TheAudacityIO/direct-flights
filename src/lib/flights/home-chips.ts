/**
 * Quick-pick airports on the empty map. The server renders the global list;
 * after hydration the browser may swap in airports for the visitor's own
 * timezone (Intl, read on the device and never sent anywhere). No default
 * city: the site is global.
 */
export const GLOBAL_CHIPS = ["LHR", "JFK", "CPH", "AMS"];

/** Exact IANA zones first, then the zone's region prefix. */
const BY_ZONE: Record<string, string[]> = {
  "Europe/London": ["LHR", "MAN", "EDI", "LGW"],
  "Europe/Dublin": ["DUB", "SNN", "ORK", "LHR"],
  "Europe/Copenhagen": ["CPH", "BLL", "AAL", "MMX"],
  "Europe/Oslo": ["OSL", "BGO", "TRF", "SVG"],
  "Europe/Stockholm": ["ARN", "GOT", "MMX", "NYO"],
  "Europe/Helsinki": ["HEL", "TMP", "OUL", "TKU"],
  "Europe/Amsterdam": ["AMS", "EIN", "RTM", "BRU"],
  "Europe/Berlin": ["FRA", "MUC", "BER", "DUS"],
  "Europe/Paris": ["CDG", "ORY", "NCE", "LYS"],
  "Europe/Madrid": ["MAD", "BCN", "AGP", "PMI"],
  "Europe/Rome": ["FCO", "MXP", "VCE", "NAP"],
  "America/New_York": ["JFK", "EWR", "BOS", "PHL"],
  "America/Chicago": ["ORD", "DFW", "IAH", "MSP"],
  "America/Denver": ["DEN", "SLC", "PHX", "ABQ"],
  "America/Phoenix": ["PHX", "LAS", "DEN", "LAX"],
  "America/Los_Angeles": ["LAX", "SFO", "SEA", "SAN"],
  "America/Toronto": ["YYZ", "YUL", "YOW", "JFK"],
  "America/Vancouver": ["YVR", "SEA", "YYC", "SFO"],
  "Australia/Sydney": ["SYD", "MEL", "BNE", "AKL"],
};

const BY_REGION: Record<string, string[]> = {
  Europe: ["LHR", "AMS", "CDG", "FRA"],
  America: ["JFK", "LAX", "ORD", "ATL"],
  Asia: ["DXB", "SIN", "HKG", "NRT"],
  Australia: ["SYD", "MEL", "BNE", "PER"],
  Pacific: ["AKL", "SYD", "HNL", "NAN"],
  Africa: ["JNB", "CAI", "ADD", "NBO"],
};

/** Airports for a timezone; `local` is false when we fell back to the global list. */
export function chipsForTimezone(zone: string | undefined): { codes: string[]; local: boolean } {
  if (zone && BY_ZONE[zone]) return { codes: BY_ZONE[zone], local: true };
  const region = zone?.split("/")[0];
  if (region && BY_REGION[region]) return { codes: BY_REGION[region], local: true };
  return { codes: GLOBAL_CHIPS, local: false };
}
