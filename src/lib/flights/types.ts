/** Shared JSON contract for the static OpenFlights dump (and any live swap-in). */

export type AirportIndex = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  /** Count of unique nonstop destinations from this airport. */
  destinations: number;
};

export type Destination = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  km: number;
  /** Estimated block time: haversine km / 850 km/h + 30 min, rounded. */
  minutes: number;
  airlines: string[];
  /** Operating weekdays (`sun`…`sat`). Absent on the OpenFlights dump. */
  days?: string[];
  /** Last operated date `YYYY-MM-DD` inside the lookback. */
  lastSeen?: string;
  /** Distinct operated days (or flights) counted in the lookback. */
  flightCount?: number;
};

export type RouteFile = {
  origin: string;
  destinations: Destination[];
};

export type DatasetMeta = {
  source: string;
  attribution: string;
  generatedAt: string;
  airportCount: number;
  originCount: number;
  routeCount: number;
  note: string;
  lookbackDays?: number;
  windowFrom?: string;
  windowTo?: string;
};

/** Internal airport record used while building the dataset. */
export type AirportRecord = {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string | null;
  icao: string | null;
  lat: number;
  lon: number;
  type: string;
};

export type RawRoute = {
  airline: string;
  airlineId: string;
  src: string;
  srcId: string;
  dst: string;
  dstId: string;
  codeshare: boolean;
  stops: number;
};
