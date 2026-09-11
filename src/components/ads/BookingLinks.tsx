import { ExternalLink } from "lucide-react";
import type { Destination } from "@/lib/flights/types";

/** Deep links into the big fare searches, nonstop pre-filtered. No affiliate ids (v1 non-goal). */
function bookingLinks(origin: string, dest: Destination) {
  const o = origin.toUpperCase();
  const d = dest.iata.toUpperCase();
  return [
    {
      name: "Google Flights",
      href: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Nonstop flights from ${o} to ${d}`)}`,
    },
    { name: "Skyscanner", href: `https://www.skyscanner.net/transport/flights/${o.toLowerCase()}/${d.toLowerCase()}/` },
    { name: "Kayak", href: `https://www.kayak.com/flights/${o}-${d}?fs=stops=0` },
  ];
}

export function BookingLinks({ origin, dest }: { origin: string; dest: Destination }) {
  const perWeek =
    dest.flightCount && dest.flightCount > 0 ? Math.max(1, Math.round(dest.flightCount / 4.3)) : null;
  return (
    <div className="text-xs leading-relaxed text-muted">
      {perWeek ? (
        <p>
          About <span className="font-mono text-fg">{perWeek}</span>{" "}
          {perWeek === 1 ? "flight" : "flights"} a week in the last observed month.
        </p>
      ) : (
        <p>Frequency unknown for archive routes; the fare search below shows live options.</p>
      )}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {bookingLinks(origin, dest).map((l) => (
          <li key={l.name}>
            <a
              href={l.href}
              target="_blank"
              rel="nofollow noopener"
              className="inline-flex items-center gap-1 text-fg underline underline-offset-2 hover:text-accent"
            >
              {l.name}
              <ExternalLink className="size-3" strokeWidth={1.75} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
