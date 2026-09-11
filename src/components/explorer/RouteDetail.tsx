import { ArrowRight, X } from "lucide-react";
import { formatDuration, formatKm } from "@/lib/flights/geo";
import { formatDays } from "@/lib/flights/observed";
import type { AirportIndex, Destination } from "@/lib/flights/types";
import { Button } from "@/components/ui/button";
import { ProvenanceChip } from "./ProvenanceChip";

type Props = {
  origin: AirportIndex;
  dest: Destination;
  onClose: () => void;
};

export function RouteDetail({ origin, dest, onClose }: Props) {
  const days = formatDays(dest.days);
  return (
    <section
      aria-label={`Route ${origin.iata} to ${dest.iata}`}
      className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-panel)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-sm tracking-wide text-fg">
            <span>{origin.iata}</span>
            <ArrowRight className="size-3.5 text-accent" strokeWidth={1.75} aria-hidden />
            <span>{dest.iata}</span>
            <ProvenanceChip dest={dest} />
          </p>
          <p className="mt-1 truncate text-sm text-muted">
            {origin.city || origin.name} → {dest.city || dest.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-sm"
          onClick={onClose}
          aria-label="Close route detail"
        >
          <X className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-subtle">Duration</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums text-fg">
            {formatDuration(dest.minutes)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-subtle">Distance</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums text-fg">
            {formatKm(dest.km)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {dest.airlines.length > 0
          ? dest.airlines.join(" · ")
          : "Operating airline not listed in this snapshot."}
        {days ? ` · ${days}` : ""}
      </p>
      <p className="mt-2 text-[11px] text-subtle">
        {dest.lastSeen
          ? `Last seen ${dest.lastSeen}. Estimated block time, not a booking.`
          : "Estimated block time: great-circle ÷ 850 km/h + 30 min. Not a live schedule."}
      </p>
    </section>
  );
}
