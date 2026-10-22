import { ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";
import {
  isAffiliate,
  partnerLabel,
  partnerRel,
  partnerUrl,
  partnerWhy,
  type Partner,
} from "@/lib/affiliates";

type Props = {
  partners: Partner[];
  /** Place name for the hotel and activity searches. */
  destination?: string;
  /** Airport IATA code for the transfer link. */
  origin?: string;
  /** Dataset country name for the car rental link. */
  country?: string;
  /** Where on the site the box sits, for the click event. */
  placement: string;
  title?: string;
};

/** "Plan the trip" partner links with a commission disclosure. Renders nothing without partners. */
export function PlanTrip({ partners, destination, origin, country, placement, title = "Plan the trip" }: Props) {
  if (partners.length === 0) return null;
  return (
    <aside className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-base font-medium text-fg">{title}</h2>
      <ul className="mt-3 space-y-2.5 text-sm">
        {partners.map((partner) => {
          const affiliate = isAffiliate(partner);
          return (
            <li key={partner}>
              <a
                href={partnerUrl(partner, { destination, origin, country })}
                target="_blank"
                rel={partnerRel(affiliate)}
                onClick={() =>
                  track("affiliate_click", {
                    partner,
                    placement,
                    page: window.location.pathname,
                    destination: destination ?? "",
                    affiliate,
                  })
                }
                className="inline-flex items-center gap-1 text-fg underline underline-offset-2 hover:text-accent"
              >
                {partnerLabel(partner)}
                <ExternalLink className="size-3" strokeWidth={1.75} aria-hidden />
              </a>
              <span className="block text-xs text-muted">{partnerWhy(partner)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11px] text-subtle">
        Some links may earn us a commission at no extra cost to you.
      </p>
    </aside>
  );
}
