/**
 * Fetch AeroDataBox daily-route stats for a rotating set of origins and
 * accumulate them into the committed overlay input:
 * data/observed/operated-routes.json.
 *
 * Endpoint (RapidAPI): GET /airports/iata/{code}/stats/routes/daily
 * — the /flights/... path variant 404s.
 *
 * Free-plan budgeting: quota is read live from the RapidAPI rate-limit
 * response headers and fetching stops at the unit/request floors, so a run
 * can never exhaust the month. If no unit header is recognizable, the run
 * falls back to a fixed conservative airport cap and says so.
 *
 * Rotation: the file ACCUMULATES. Each run spends its units on the CAG
 * canary, then origins never tried (Search Console candidates from
 * data/search/keep-pages.json first, then by global rank), then the
 * oldest-fetched origins. A re-fetched origin replaces only its own rows;
 * the rest keep theirs, each dated by its rows' lastSeen.
 *
 * Usage: AERODATABOX_API_KEY=... npm run data:fetch-observed
 * Tuning env: ADB_MAX_AIRPORTS (120), ADB_UNIT_FLOOR (100),
 *             ADB_REQUEST_FLOOR (50), ADB_FALLBACK_MAX (60), ADB_DELAY_MS (400)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { fetchOrder, mergeObservedRun, toOperatedRoutes } from "../src/lib/flights/overlay.ts";
import { observedAsOf, type OperatedRoute } from "../src/lib/flights/observed.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "data/observed");
const OUT_FILE = path.join(OUT_DIR, "operated-routes.json");
const KEEP_PAGES = path.join(ROOT, "data/search/keep-pages.json");
const HOST = "aerodatabox.p.rapidapi.com";
const LOOKBACK_DAYS = 30;

const KEY = process.env.AERODATABOX_API_KEY ?? "";
const MAX_AIRPORTS = Number(process.env.ADB_MAX_AIRPORTS ?? 120);
const UNIT_FLOOR = Number(process.env.ADB_UNIT_FLOOR ?? 100);
const REQUEST_FLOOR = Number(process.env.ADB_REQUEST_FLOOR ?? 50);
const FALLBACK_MAX = Number(process.env.ADB_FALLBACK_MAX ?? 60);
const DELAY_MS = Number(process.env.ADB_DELAY_MS ?? 400);
// CAG is the canary airport (data-refresh.yml checks CAG->DUB): fetched
// first every run so the check always sees fresh data. ADB_PINNED (manual
// dispatch) adds origins fetched right after it, ahead of the rotation.
const CANARY = "CAG";
const PINNED = (process.env.ADB_PINNED ?? "")
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

  const prev: { routes?: OperatedRoute[]; skippedAsOf?: Record<string, string> } = existsSync(OUT_FILE)
    ? JSON.parse(await readFile(OUT_FILE, "utf8"))
    : {};
  const prevRoutes = prev.routes ?? [];
  const candidates: string[] = existsSync(KEEP_PAGES)
    ? (JSON.parse(await readFile(KEEP_PAGES, "utf8")).airports ?? [])
    : [];
  const order = fetchOrder({
    first: [CANARY, ...PINNED],
    candidates,
    ranked: ranked.map((r) => r.iata),
    observedAsOf: observedAsOf(prevRoutes),
    skippedAsOf: prev.skippedAsOf ?? {},
    today: new Date().toISOString().slice(0, 10),
  });

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

  const merged = mergeObservedRun(
    { routes: prevRoutes, skippedAsOf: prev.skippedAsOf },
    { asOf, routes, fetchedOrigins, skippedOrigins },
  );

  // asOf, fetchedOrigins, skippedOrigins and the quota fields describe THIS
  // run; routes and skippedAsOf are the accumulated overlay.
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
    skippedAsOf: merged.skippedAsOf,
    routes: merged.routes,
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
        totalOrigins: Object.keys(observedAsOf(merged.routes)).length,
        totalLegs: merged.routes.length,
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
