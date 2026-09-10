/**
 * Fetch AeroDataBox daily-route stats for the busiest origins and write the
 * committed overlay input: data/observed/operated-routes.json.
 *
 * Endpoint (RapidAPI): GET /airports/iata/{code}/stats/routes/daily
 * — the /flights/... path variant 404s.
 *
 * Free-plan budgeting: quota is read live from the RapidAPI rate-limit
 * response headers and fetching stops at the unit/request floors, so a run
 * can never exhaust the month. If no unit header is recognizable, the run
 * falls back to a fixed conservative airport cap and says so.
 *
 * Usage: AERODATABOX_API_KEY=... npm run data:fetch-observed
 * Tuning env: ADB_MAX_AIRPORTS (120), ADB_UNIT_FLOOR (100),
 *             ADB_REQUEST_FLOOR (50), ADB_FALLBACK_MAX (60), ADB_DELAY_MS (400)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { toOperatedRoutes } from "../src/lib/flights/overlay.ts";
import type { OperatedRoute } from "../src/lib/flights/observed.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "data/observed");
const OUT_FILE = path.join(OUT_DIR, "operated-routes.json");
const HOST = "aerodatabox.p.rapidapi.com";
const LOOKBACK_DAYS = 30;

const KEY = process.env.AERODATABOX_API_KEY ?? "";
const MAX_AIRPORTS = Number(process.env.ADB_MAX_AIRPORTS ?? 120);
const UNIT_FLOOR = Number(process.env.ADB_UNIT_FLOOR ?? 100);
const REQUEST_FLOOR = Number(process.env.ADB_REQUEST_FLOOR ?? 50);
const FALLBACK_MAX = Number(process.env.ADB_FALLBACK_MAX ?? 60);
const DELAY_MS = Number(process.env.ADB_DELAY_MS ?? 400);
// Origins fetched FIRST regardless of global rank. CAG is the canary
// airport: without the pin it never makes the free-plan top-N cut.
const PINNED = (process.env.ADB_PINNED ?? "CAG")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter((s) => /^[A-Z]{3}$/.test(s));

type Quota = { unitsRemaining: number | null; requestsRemaining: number | null };

function readQuota(headers: Headers): Quota {
  let unitsRemaining: number | null = null;
  let requestsRemaining: number | null = null;
  headers.forEach((value, name) => {
    const key = name.toLowerCase();
    if (!key.includes("ratelimit") || !key.includes("remaining")) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (key.includes("request")) {
      requestsRemaining = n;
    } else if (unitsRemaining === null || key.includes("unit")) {
      unitsRemaining = n;
    }
  });
  return { unitsRemaining, requestsRemaining };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!KEY) {
    console.error("AERODATABOX_API_KEY is not set; refusing to run.");
    process.exit(2);
  }

  const airportsRaw = await readFile(path.join(ROOT, "public/data/airports.json"), "utf8");
  const ranked: { iata: string; destinations: number }[] = JSON.parse(airportsRaw);
  ranked.sort((a, b) => b.destinations - a.destinations || a.iata.localeCompare(b.iata));
  const order = [...PINNED, ...ranked.map((r) => r.iata).filter((i) => !PINNED.includes(i))];

  const asOf = new Date().toISOString().slice(0, 10);
  const routes: OperatedRoute[] = [];
  const fetchedOrigins: string[] = [];
  const skippedOrigins: string[] = [];
  let unitsRemaining: number | null = null;
  let requestsRemaining: number | null = null;
  let unitCostPerCall: number | null = null;
  let cap = Math.min(MAX_AIRPORTS, order.length);
  let stopReason = "cap reached";

  for (let i = 0; i < cap; i++) {
    const iata = order[i];
    const url = `https://${HOST}/airports/iata/${iata}/stats/routes/daily`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "X-RapidAPI-Key": KEY, "X-RapidAPI-Host": HOST },
      });
    } catch (err) {
      console.error(`network error on ${iata}: ${String(err)}; retrying once`);
      await sleep(2000);
      try {
        res = await fetch(url, {
          headers: { "X-RapidAPI-Key": KEY, "X-RapidAPI-Host": HOST },
        });
      } catch (err2) {
        stopReason = `network error on ${iata}: ${String(err2)}`;
        break;
      }
    }

    const quota = readQuota(res.headers);
    if (quota.unitsRemaining !== null) {
      if (unitsRemaining !== null && quota.unitsRemaining < unitsRemaining) {
        unitCostPerCall = unitsRemaining - quota.unitsRemaining;
      }
      unitsRemaining = quota.unitsRemaining;
    }
    if (quota.requestsRemaining !== null) requestsRemaining = quota.requestsRemaining;

    if (res.status === 404) {
      skippedOrigins.push(iata);
    } else if (res.status === 429) {
      stopReason = "429 rate limited";
      break;
    } else if (!res.ok) {
      stopReason = `HTTP ${res.status} on ${iata}`;
      break;
    } else {
      const payload = await res.json();
      const legs = toOperatedRoutes(iata, payload, asOf, LOOKBACK_DAYS);
      if (legs.length === 0) {
        skippedOrigins.push(iata);
      } else {
        routes.push(...legs);
        fetchedOrigins.push(iata);
      }
    }

    if (unitsRemaining === null && i === 0) {
      cap = Math.min(cap, FALLBACK_MAX);
      console.error(
        `no unit quota header recognized; capping at ${cap} airports (headers: ` +
          `${[...res.headers.keys()].filter((h) => h.includes("ratelimit")).join(", ") || "none"})`,
      );
    }
    if (unitsRemaining !== null && unitsRemaining <= UNIT_FLOOR) {
      stopReason = `unit floor reached (${unitsRemaining} <= ${UNIT_FLOOR})`;
      break;
    }
    if (requestsRemaining !== null && requestsRemaining <= REQUEST_FLOOR) {
      stopReason = `request floor reached (${requestsRemaining} <= ${REQUEST_FLOOR})`;
      break;
    }
    await sleep(DELAY_MS);
  }

  routes.sort(
    (a, b) =>
      a.originIata.localeCompare(b.originIata) ||
      a.destIata.localeCompare(b.destIata) ||
      a.airline.localeCompare(b.airline),
  );

  const doc = {
    source: "AeroDataBox (RapidAPI)",
    endpoint: "/airports/iata/{code}/stats/routes/daily",
    asOf,
    lookbackDays: LOOKBACK_DAYS,
    fetchedOrigins,
    skippedOrigins,
    unitCostPerCall,
    unitsRemaining,
    requestsRemaining,
    routes,
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(doc, null, 1));

  console.log(
    JSON.stringify(
      {
        asOf,
        origins: fetchedOrigins.length,
        skipped: skippedOrigins.length,
        legs: routes.length,
        unitCostPerCall,
        unitsRemaining,
        requestsRemaining,
        stopReason,
      },
      null,
      2,
    ),
  );
}

main();
