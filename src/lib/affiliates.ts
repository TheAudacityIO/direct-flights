/**
 * Partner links for the "Plan the trip" box and the fare-search links. Each
 * partner's affiliate URL is a template from a build-time env var
 * (`VITE_AFF_<PARTNER>_URL`, a repository variable in deploy.yml) with `{q}`
 * for the URL-encoded destination, for flights `{origin}`, and `{u}` for the
 * URL-encoded plain partner URL (Travelpayouts tracking links wrap it:
 * `https://tp.media/r?campaign_id=..&marker=..&p=..&trs=..&u={u}`). Unset or not
 * https: the plain, non-affiliate URL. No Vite-only APIs beyond the optional
 * env read, so `node --test` can import it.
 */
export const PARTNERS = ["flights", "hotels", "activities", "esim", "insurance", "compensation"] as const;
export type Partner = (typeof PARTNERS)[number];

export type LinkContext = { destination?: string; origin?: string };

const enc = encodeURIComponent;

const INFO: Record<Partner, { label: string; why: string; fallback: (ctx: LinkContext) => string }> = {
  flights: {
    label: "Kiwi.com",
    why: "Compare fares on the nonstop.",
    // Kiwi's deep link takes IATA codes (verified 2026-10-22: FCO/NCE resolves to the route search).
    fallback: ({ origin, destination }) =>
      origin && destination && /^[A-Z]{3}$/.test(destination)
        ? `https://www.kiwi.com/deep?from=${origin}&to=${destination}&departure=anytime&return=no-return`
        : "https://www.kiwi.com/en/",
  },
  hotels: {
    label: "Booking.com",
    why: "Places to stay at the other end.",
    fallback: ({ destination }) =>
      destination
        ? `https://www.booking.com/searchresults.html?ss=${enc(destination)}`
        : "https://www.booking.com/",
  },
  activities: {
    label: "Tiqets",
    why: "Tickets for museums and attractions.",
    // /en/search?q= redirects to the city's attractions page (no trailing slash: /search/ 404s).
    fallback: ({ destination }) =>
      destination ? `https://www.tiqets.com/en/search?q=${enc(destination)}` : "https://www.tiqets.com/en/",
  },
  esim: {
    label: "Airalo",
    why: "A travel eSIM for data abroad.",
    fallback: () => "https://www.airalo.com/",
  },
  insurance: {
    label: "SafetyWing",
    why: "Travel medical insurance.",
    fallback: () => "https://safetywing.com/",
  },
  compensation: {
    label: "AirHelp",
    why: "Claim compensation for a delayed or cancelled flight.",
    fallback: () => "https://www.airhelp.com/",
  },
};

const TEMPLATES: Record<Partner, string> = {
  flights: import.meta.env?.VITE_AFF_FLIGHTS_URL ?? "",
  hotels: import.meta.env?.VITE_AFF_HOTELS_URL ?? "",
  activities: import.meta.env?.VITE_AFF_ACTIVITIES_URL ?? "",
  esim: import.meta.env?.VITE_AFF_ESIM_URL ?? "",
  insurance: import.meta.env?.VITE_AFF_INSURANCE_URL ?? "",
  compensation: import.meta.env?.VITE_AFF_COMPENSATION_URL ?? "",
};

const usable = (template: string) => template.startsWith("https://");

export function isPartner(value: string): value is Partner {
  return (PARTNERS as readonly string[]).includes(value);
}

export function partnerLabel(partner: Partner): string {
  return INFO[partner].label;
}

export function partnerWhy(partner: Partner): string {
  return INFO[partner].why;
}

export function isAffiliate(partner: Partner, template = TEMPLATES[partner]): boolean {
  return usable(template);
}

export function partnerUrl(partner: Partner, ctx: LinkContext, template = TEMPLATES[partner]): string {
  if (!usable(template)) return INFO[partner].fallback(ctx);
  return template
    .replaceAll("{u}", enc(INFO[partner].fallback(ctx)))
    .replaceAll("{q}", enc(ctx.destination ?? ""))
    .replaceAll("{origin}", enc(ctx.origin ?? ""));
}

/** Paid links are marked sponsored (Google's link-attribute guidance); every outbound link is nofollow. */
export function partnerRel(affiliate: boolean): string {
  return affiliate ? "sponsored nofollow noopener" : "nofollow noopener";
}
