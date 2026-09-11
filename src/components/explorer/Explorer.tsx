import { useEffect, useMemo, useState } from "react";
import { ChevronsDown, ChevronsUp, Minus, Plus, RotateCcw } from "lucide-react";
import { AirportSearch } from "./AirportSearch";
import { DestinationList } from "./DestinationList";
import { FlightMap } from "./FlightMap";
import { RouteDetail } from "./RouteDetail";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ads/config";
import { Button } from "@/components/ui/button";
import { loadAirports, loadRoutes } from "@/lib/flights/api";
import type { AirportIndex, Destination, RouteFile } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

export type ExplorerSearch = {
  from?: string;
  to?: string;
};

type Props = {
  search: ExplorerSearch;
  onSearchChange: (next: ExplorerSearch) => void;
};

export function Explorer({ search, onSearchChange }: Props) {
  const [airports, setAirports] = useState<AirportIndex[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeFile, setRouteFile] = useState<RouteFile | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sheet, setSheet] = useState<"peek" | "split" | "full">("split");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAirports()
      .then((data) => {
        if (!cancelled) {
          setAirports(data);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load airports.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const origin = useMemo(() => {
    if (!airports || !search.from) return null;
    return airports.find((a) => a.iata === search.from) ?? null;
  }, [airports, search.from]);

  const originIata = origin?.iata;
  useEffect(() => {
    if (!originIata) {
      setRouteFile(null);
      setRoutesError(null);
      setRoutesLoading(false);
      return;
    }
    let cancelled = false;
    setRoutesLoading(true);
    setRoutesError(null);
    loadRoutes(originIata)
      .then((file) => {
        if (!cancelled) setRouteFile(file);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRouteFile(null);
          setRoutesError(err instanceof Error ? err.message : "Could not load routes.");
        }
      })
      .finally(() => {
        if (!cancelled) setRoutesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [originIata]);

  const destinations = routeFile?.destinations ?? [];
  const selected: Destination | null =
    (search.to && destinations.find((d) => d.iata === search.to)) || null;

  function selectOrigin(ap: AirportIndex) {
    setSheet("split");
    onSearchChange({ from: ap.iata });
  }

  function clearOrigin() {
    onSearchChange({});
  }

  function selectDest(iata: string) {
    if (!search.from) return;
    onSearchChange({
      from: search.from,
      to: iata === search.to ? undefined : iata,
    });
  }

  const sheetHeight =
    sheet === "full" ? "min(88dvh, 100%)" : sheet === "peek" ? "9.5rem" : "min(62dvh, 34rem)";

  function cycleSheet() {
    setSheet((s) => (s === "split" ? "full" : s === "full" ? "peek" : "split"));
  }

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-bg text-fg">
      <div className="relative min-h-0 flex-1">
        <FlightMap
          origin={origin}
          destinations={destinations}
          selectedIata={selected?.iata ?? null}
          onSelectDest={selectDest}
          compactPanel={isMobile}
        />
        {!(isMobile && origin && sheet === "full") && <MapZoomButtons />}

        <header className="pointer-events-none absolute inset-x-0 top-0 z-40 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-5">
          <div className="pointer-events-auto mx-auto flex max-w-xl flex-col gap-2 md:mx-0 md:max-w-md">
            <div className="flex items-center gap-2">
              <BrandMark hasOrigin={Boolean(origin)} />
              <div className="min-w-0 flex-1">
                <AirportSearch
                  airports={airports ?? []}
                  origin={origin}
                  onSelect={selectOrigin}
                  onClear={clearOrigin}
                  disabled={!airports}
                />
              </div>
            </div>
            {routesLoading && (
              <div
                className="h-0.5 overflow-hidden rounded-full bg-border"
                role="status"
                aria-label="Loading routes"
              >
                <div className="h-full w-1/3 animate-pulse bg-accent" />
              </div>
            )}
          </div>
        </header>

        {!origin && !loadError && (
          <EmptyHint
            airports={airports}
            onPick={selectOrigin}
            loading={!airports && !loadError}
            unknownCode={airports && search.from ? search.from : null}
          />
        )}

        {loadError && (
          <div className="absolute inset-x-0 top-24 z-20 mx-auto max-w-md px-4">
            <div className="rounded-lg border border-border bg-surface p-4 text-sm text-fg shadow-[var(--shadow-panel)]">
              <p className="font-medium">Couldn’t load airport data</p>
              <p className="mt-1 text-muted">{loadError}</p>
              <Button className="mt-3" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {origin && selected && (
          <div className="pointer-events-none absolute left-3 right-3 top-[5.75rem] z-20 hidden md:left-5 md:right-auto md:block md:w-[22.5rem]">
            <div className="pointer-events-auto">
              <RouteDetail
                origin={origin}
                dest={selected}
                onClose={() => onSearchChange({ from: origin.iata })}
              />
            </div>
          </div>
        )}
      </div>

      {origin && (
        <section
          aria-label="Nonstop destinations"
          className="relative z-30 flex min-h-0 flex-col border-t border-border bg-surface md:hidden"
          style={{ height: sheetHeight }}
        >
          <button
            type="button"
            onClick={cycleSheet}
            className="flex h-8 w-full shrink-0 flex-col items-center justify-center text-muted"
            aria-label={
              sheet === "full"
                ? "Collapse destination list"
                : sheet === "peek"
                  ? "Expand destination list"
                  : "Expand destination list to full height"
            }
          >
            <span className="h-1 w-10 rounded-full bg-border" />
            {sheet === "full" ? (
              <ChevronsDown className="mt-0.5 size-3.5" strokeWidth={1.75} />
            ) : (
              <ChevronsUp className="mt-0.5 size-3.5" strokeWidth={1.75} />
            )}
          </button>
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {selected ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
                <RouteDetail
                  origin={origin}
                  dest={selected}
                  onClose={() => onSearchChange({ from: origin.iata })}
                />
              </div>
            ) : (
              <>
                <PanelHeader
                  origin={origin}
                  count={destinations.length}
                  loading={routesLoading}
                  error={routesError}
                  onReset={clearOrigin}
                  primary={isMobile}
                />
                {sheet !== "peek" && (
                  <DestinationList
                    key={origin.iata}
                    destinations={destinations}
                    selectedIata={null}
                    onSelect={selectDest}
                  />
                )}
              </>
            )}
          </div>
        </section>
      )}

      {origin && (
        <aside
          className={cn(
            "pointer-events-auto absolute bottom-0 right-0 top-0 hidden w-[22.5rem] md:flex",
            "flex-col border-l border-border bg-surface/95 pt-5 pb-5 pl-4 pr-3 backdrop-blur-sm",
          )}
        >
          <PanelHeader
            origin={origin}
            count={destinations.length}
            loading={routesLoading}
            error={routesError}
            onReset={clearOrigin}
            primary={!isMobile}
          />
          <DestinationList
            key={origin.iata}
            destinations={destinations}
            selectedIata={selected?.iata ?? null}
            onSelect={selectDest}
          />
          <AdSlot slot={AD_SLOTS.mapSidebar} minHeight={100} className="mt-3 shrink-0 pr-1" />
        </aside>
      )}
    </div>
  );
}

function BrandMark({ hasOrigin }: { hasOrigin: boolean }) {
  return (
    <button
      type="button"
      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent hover:bg-surface-2"
      aria-label={hasOrigin ? "Show all routes on the map" : "FlyDirectFrom"}
      title={hasOrigin ? "Show all routes" : "FlyDirectFrom"}
      onClick={() => {
        if (hasOrigin) {
          window.dispatchEvent(new Event("direct-flights-fit"));
        } else {
          document.getElementById("airport-search")?.focus();
        }
      }}
    >
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="16" r="9.25" fill="none" className="stroke-border" strokeWidth="1.5" />
        <path
          d="M6.5 20.5 C11 8.5, 22 7.5, 26 13"
          fill="none"
          className="stroke-accent"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="6.5" cy="20.5" r="1.7" className="fill-fg" />
        <circle cx="26" cy="13" r="1.7" className="fill-accent" />
      </svg>
    </button>
  );
}

function PanelHeader({
  origin,
  count,
  loading,
  error,
  onReset,
  primary,
}: {
  origin: AirportIndex;
  count: number;
  loading: boolean;
  error: string | null;
  onReset: () => void;
  /** The sheet and the aside both mount; only the visible one carries the page's h1. */
  primary: boolean;
}) {
  const Heading = primary ? "h1" : "p";
  return (
    <div className="mb-3 flex items-start justify-between gap-2 px-1">
      <div className="min-w-0">
        <p className="font-mono text-sm tracking-wide text-accent">{origin.iata}</p>
        <Heading className="truncate text-base font-medium text-fg text-balance">
          {origin.city || origin.name}
        </Heading>
        <p className="mt-0.5 text-xs text-muted">
          {loading
            ? "Loading nonstops…"
            : error
              ? error
              : `${count} nonstop ${count === 1 ? "destination" : "destinations"}`}
        </p>
        {!loading && !error && count > 0 && (
          <a
            href={`/from/${origin.iata}`}
            className="mt-1 inline-block text-xs text-subtle underline underline-offset-2 hover:text-fg"
          >
            Full list as a page
          </a>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-sm"
        onClick={onReset}
        aria-label="Reset origin"
      >
        <RotateCcw className="size-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}

function EmptyHint({
  airports,
  onPick,
  loading,
  unknownCode,
}: {
  airports: AirportIndex[] | null;
  onPick: (ap: AirportIndex) => void;
  loading: boolean;
  unknownCode: string | null;
}) {
  const chips = ["CAG", "FCO", "LHR", "JFK"];
  const found =
    airports?.filter((a) => chips.includes(a.iata) && a.destinations > 0) ?? [];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[5.75rem] z-10 flex justify-center px-4 md:top-[6.5rem] md:justify-start md:px-5">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-surface/95 p-5 shadow-[var(--shadow-panel)] backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Nonstop explorer</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-fg text-balance">
          Search an airport. See every nonstop.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
          Pick an airport and the map draws every route you can fly without a connection, with the
          airlines, the distance and a rough flight time. Routes we have seen operate recently are
          marked Verified; the rest come from the OpenFlights archive.
        </p>
        {unknownCode ? (
          <p className="mt-3 text-sm text-fg">
            No airport with code <span className="font-mono text-accent">{unknownCode}</span> has
            nonstop routes in our data. Try another one:
          </p>
        ) : null}
        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading airports…</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {found.map((ap) => (
              <Button
                key={ap.iata}
                variant="chip"
                size="chip"
                onClick={() => onPick(ap)}
              >
                <span className="font-mono text-accent">{ap.iata}</span>
                <span>{ap.city}</span>
              </Button>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-subtle">
          <a href="/from" className="underline underline-offset-2 hover:text-fg">
            All airports
          </a>
          {" · "}
          <a href="/about-the-data" className="underline underline-offset-2 hover:text-fg">
            About the data
          </a>
          {" · "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-fg">
            Privacy
          </a>
        </p>
      </div>
    </div>
  );
}

function MapZoomButtons() {
  return (
    <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-20 flex flex-col overflow-hidden rounded-md border border-border bg-surface md:bottom-8 md:left-5">
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-none"
        aria-label="Zoom in"
        onClick={() => window.dispatchEvent(new CustomEvent("direct-flights-zoom", { detail: 1 }))}
      >
        <Plus className="size-4" strokeWidth={1.75} />
      </Button>
      <div className="h-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-none"
        aria-label="Zoom out"
        onClick={() => window.dispatchEvent(new CustomEvent("direct-flights-zoom", { detail: -1 }))}
      >
        <Minus className="size-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
