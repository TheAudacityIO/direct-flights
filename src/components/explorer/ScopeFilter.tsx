import type { Scope } from "@/lib/flights/scope";
import { cn } from "@/lib/utils";

type Props = {
  scope: Scope;
  counts: { all: number; domestic: number; international: number };
  onChange: (scope: Scope) => void;
  /** Tighter single-row layout for the mobile sheet. */
  compact?: boolean;
};

const options: { value: Scope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

export function ScopeFilter({ scope, counts, onChange, compact = false }: Props) {
  if (counts.domestic === 0 || counts.international === 0) return null;

  return (
    <div
      role="group"
      aria-label="Filter by route type"
      className={cn(
        "mx-1 flex gap-1 rounded-md border border-border bg-bg p-0.5",
        compact ? "mb-1.5" : "mb-2",
      )}
    >
      {options.map(({ value, label }) => {
        const active = scope === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center gap-1 rounded text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
              compact ? "whitespace-nowrap px-1.5" : "px-2",
              active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/70 hover:text-fg",
            )}
          >
            {label}{" "}
            <span className="text-[11px] tabular-nums text-muted">{counts[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
