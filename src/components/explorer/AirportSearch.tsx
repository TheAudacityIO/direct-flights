import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { searchAirports } from "@/lib/flights/search";
import type { AirportIndex } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

type Props = {
  airports: AirportIndex[];
  origin: AirportIndex | null;
  onSelect: (airport: AirportIndex) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function AirportSearch({
  airports,
  origin,
  onSelect,
  onClear,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);

  const results = useMemo(
    () => searchAirports(airports, query, 8),
    [airports, query],
  );

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function choose(ap: AirportIndex) {
    onSelect(ap);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && results[active]) {
        e.preventDefault();
        choose(results[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else if (query) {
        setQuery("");
      } else if (origin) {
        onClear();
      }
    }
  }

  const showList = open && query.trim().length > 0;
  const activeId = showList && results[active] ? `${listId}-${results[active].iata}` : undefined;

  return (
    <div className="relative w-full">
      <label htmlFor="airport-search" className="sr-only">
        Search airports by IATA, city, or name
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        ref={inputRef}
        id="airport-search"
        type="text"
        role="combobox"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={origin ? "Change origin" : "Search IATA, city, airport"}
        value={query}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={activeId}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          if (query.trim()) setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "h-11 w-full rounded-lg border bg-surface pl-10 pr-11 text-sm text-fg placeholder:text-subtle",
          "border-border outline-none transition-[border-color,box-shadow] duration-150",
          "focus:border-accent/50 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_22%,transparent)]",
        )}
      />
      {(query || origin) && (
        <button
          type="button"
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (query) {
              setQuery("");
              inputRef.current?.focus();
            } else {
              onClear();
            }
          }}
          aria-label={query ? "Clear search" : "Clear origin"}
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-[var(--shadow-panel)]"
        >
          {results.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-muted">
              No airports match “{query.trim()}”.
            </li>
          ) : (
            results.map((ap, i) => {
              const selected = i === active;
              return (
                <li
                  key={ap.iata}
                  id={`${listId}-${ap.iata}`}
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm",
                    selected ? "bg-surface-2" : "hover:bg-surface-2/70",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(ap)}
                >
                  <span className="w-10 shrink-0 font-mono text-[13px] font-medium tracking-wide text-accent">
                    {ap.iata}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fg">
                      {ap.city || ap.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {ap.name}
                      {ap.country ? ` · ${ap.country}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-subtle">
                    {ap.destinations}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
      {focused ? null : (
        <span className="sr-only">Press slash to focus search.</span>
      )}
    </div>
  );
}
