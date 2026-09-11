import { useMemo, useState } from "react";
import { formatDuration, formatKm } from "@/lib/flights/geo";
import { formatDays } from "@/lib/flights/observed";
import { ProvenanceChip } from "./ProvenanceChip";
import type { Destination } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

type Props = {
  destinations: Destination[];
  selectedIata: string | null;
  onSelect: (iata: string) => void;
};

export function DestinationList({ destinations, selectedIata, onSelect }: Props) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (d) =>
        d.iata.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.airlines.some((a) => a.toLowerCase().includes(q)),
    );
  }, [destinations, filter]);

  if (destinations.length === 0) {
    return (
      <p className="px-1 py-6 text-sm text-muted">
        No nonstop routes from this airport in the dataset.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {destinations.length > 12 && (
        <div className="mb-2 px-1">
          <label htmlFor="dest-filter" className="sr-only">
            Filter destinations
          </label>
          <input
            id="dest-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter destinations"
            className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-subtle outline-none focus:border-accent/50"
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="px-1 py-6 text-sm text-muted">No destinations match that filter.</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {filtered.map((d) => {
            const selected = d.iata === selectedIata;
            const days = formatDays(d.days);
            return (
              <li key={d.iata}>
                <button
                  type="button"
                  onClick={() => onSelect(d.iata)}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors duration-150",
                    selected ? "bg-surface-2" : "hover:bg-surface-2/70",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 w-10 shrink-0 font-mono text-[13px] font-medium tracking-wide",
                      selected ? "text-origin" : "text-accent",
                    )}
                  >
                    {d.iata}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm text-fg">{d.city || d.name}</span>
                      <ProvenanceChip dest={d} className="shrink-0" />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {d.airlines.length > 0
                        ? d.airlines.slice(0, 3).join(" · ") +
                          (d.airlines.length > 3 ? ` +${d.airlines.length - 3}` : "")
                        : "Airline unknown"}
                      {days ? ` · ${days}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-[13px] tabular-nums text-fg">
                      {formatDuration(d.minutes)}
                    </span>
                    <span className="block text-[11px] tabular-nums text-subtle">
                      {formatKm(d.km)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
