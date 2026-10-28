import type { DatasetMeta } from "./types";

export type Faq = { q: string; a: string };

/** Shared by the visible FAQ and its FAQPage JSON-LD so the two never drift. */
export function homeFaq(meta: DatasetMeta): Faq[] {
  return [
    {
      q: "What is the difference between a direct and a nonstop flight?",
      a: "A nonstop flight takes off and lands once. Airlines sometimes sell a direct flight that keeps one flight number but stops on the way. Every route on this map is nonstop.",
    },
    {
      q: "How fresh is the route data?",
      a: `Routes marked Verified were seen operating in the ${meta.lookbackDays ?? 30} days to ${meta.windowTo ?? "the last refresh"}, for ${meta.observedOrigins ?? 0} airports so far, and the list grows every month. Routes marked Archive come from the OpenFlights archive, last updated around 2014, so confirm them with the airline before you plan around them.`,
    },
    {
      q: "Why is the flight time an estimate?",
      a: "We divide the great-circle distance by 850 km/h and add 30 minutes for taxiing, climb and descent. Real flights vary with the aircraft, the winds and the routing.",
    },
    {
      q: "How can I find a cheaper nonstop?",
      a: "Check the nearby airports listed on each airport page, since a second airport often has its own nonstops. Be flexible by a few days, and compare the same route on more than one date.",
    },
    {
      q: "Does FlyDirectFrom sell tickets?",
      a: "No. FlyDirectFrom is free and shows routes, not fares. Some booking links go to partner search sites and may earn us a small commission at no extra cost to you.",
    },
  ];
}

export function faqJsonLd(faq: Faq[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
