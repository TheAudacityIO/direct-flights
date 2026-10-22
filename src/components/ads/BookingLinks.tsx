import { ExternalLink } from "lucide-react";
import type { Destination } from "@/lib/flights/types";
import { track } from "@/lib/analytics";
import { isAffiliate, partnerRel, partnerUrl } from "@/lib/affiliates";

/**
 * Deep links into the big fare searches, nonstop pre-filtered. Kiwi.com is
 * the flights partner (Travelpayouts tracking when VITE_AFF_FLIGHTS_URL is
 * set); Google Flights and Kayak stay plain.
 */
function bookingLinks(origin: string, dest: Destination) {
  const o = origin.toUpperCase();
  const d = dest.iata.toUpperCase();
  return [
    {
      name: "Google Flights",
      href: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Nonstop flights from ${o} to ${d}`)}`,
      affiliate: false,
    },
    {
      name: "Kiwi.com",
      href: partnerUrl("flights", { origin: o, destination: d }),
      affiliate: isAffiliate("flights"),
    },
    { name: "Kayak", href: `https://www.kayak.com/flights/${o}-${d}?fs=stops=0`, affiliate: false },
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
              rel={partnerRel(l.affiliate)}
              onClick={() => {
                track("booking_link_clicked", {
                  provider: l.name,
                  origin: origin.toUpperCase(),
                  dest: dest.iata,
                });
                if (l.name === "Kiwi.com") {
                  track("affiliate_click", {
                    partner: "flights",
                    placement: "booking_links",
                    page: window.location.pathname,
                    destination: dest.iata,
                    affiliate: l.affiliate,
                  });
                }
              }}
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
