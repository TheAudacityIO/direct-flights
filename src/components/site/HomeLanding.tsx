import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AD_SLOTS } from "@/lib/ads/config";
import type { AirportIndexEntry } from "@/lib/flights/pages";
import type { DatasetMeta } from "@/lib/flights/types";
import { homeFaq } from "@/lib/flights/home-faq";

const STEPS = [
  {
    title: "Search an airport",
    body: "Type a city, an airport name or a three-letter code like JFK or LHR.",
  },
  {
    title: "See every nonstop",
    body: "The map draws each route you can fly without changing planes, with the airlines, the distance and a rough flight time.",
  },
  {
    title: "Book the route",
    body: "Pick a destination to check fares for that exact nonstop with our flight search partner.",
  },
];

const card = "rounded-xl border border-border bg-surface";
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.18em] text-subtle";
const h2 = "mt-2 text-2xl font-medium tracking-tight text-fg text-balance md:text-3xl";

/**
 * Crawlable content below the map. The map keeps the first screen; this section
 * peeks 3.5rem above the fold (Explorer stops short of 100dvh) so wheel and
 * swipe over the strip scroll the page instead of the map.
 */
export function HomeLanding({
  popular,
  meta,
}: {
  popular: AirportIndexEntry[];
  meta: DatasetMeta;
}) {
  const faq = homeFaq(meta);
  return (
    <div className="bg-bg text-fg">
      <a
        href="#how-it-works"
        className="flex h-14 items-center justify-center gap-2 border-t border-border text-sm text-muted hover:text-fg"
      >
        How it works
        <ChevronDown className="size-4" aria-hidden />
      </a>

      <div className="mx-auto w-full max-w-5xl px-5 md:px-8">
        <section aria-labelledby="landing-title" className="pt-14 pb-12 md:pt-20">
          <p className={eyebrow}>FlyDirectFrom</p>
          <h2
            id="landing-title"
            className="mt-3 max-w-3xl text-3xl font-medium leading-[1.12] tracking-tight text-balance md:text-5xl"
          >
            Every nonstop from any airport, on one map.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            Skip the layovers. See where you can fly without changing planes from{" "}
            {meta.originCount.toLocaleString("en-US")} airports, then check fares for the route you
            pick.
          </p>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-title"
          className="scroll-mt-4 border-t border-border py-12"
        >
          <p className={eyebrow}>How it works</p>
          <h2 id="how-title" className={h2}>
            Three steps to a nonstop
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${card} p-5`}>
                <span className="font-mono text-sm text-accent">0{i + 1}</span>
                <h3 className="mt-3 text-base font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {popular.length > 0 ? (
          <section aria-labelledby="popular-title" className="border-t border-border py-12">
            <p className={eyebrow}>Popular departures</p>
            <h2 id="popular-title" className={h2}>
              The best-connected airports
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {popular.map((a) => (
                <li key={a.iata}>
                  <Link
                    to="/from/$iata"
                    params={{ iata: a.iata }}
                    className={`${card} flex min-h-11 flex-col p-4 hover:border-accent`}
                  >
                    <span className="font-mono text-2xl text-accent">{a.iata}</span>
                    <span className="mt-1 truncate text-sm">{a.city}</span>
                    <span className="mt-3 text-xs text-muted">
                      <span className="font-mono text-fg">{a.destinations}</span> nonstop
                      destinations
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AdSlot slot={AD_SLOTS.home} minHeight={250} className="py-6" />

        <section aria-labelledby="data-title" className="border-t border-border py-12">
          <p className={eyebrow}>About the data</p>
          <h2 id="data-title" className={h2}>
            Where the routes come from
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className={`${card} p-5`}>
              <span className="inline-flex rounded-full border border-accent px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-accent">
                Verified
              </span>
              <h3 className="mt-3 text-base font-medium">Seen operating recently</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Routes we saw fly in the {meta.lookbackDays ?? 30} days to{" "}
                {meta.windowTo ?? "the last refresh"}, from real departure counts (AeroDataBox).{" "}
                {meta.observedOrigins ?? 0} airports are checked so far, with more added every month.
              </p>
            </div>
            <div className={`${card} p-5`}>
              <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Archive
              </span>
              <h3 className="mt-3 text-base font-medium">The widest public route map</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                The OpenFlights archive, with defunct airlines removed and absorbed brands renamed.
                It is old, so double-check these routes before you plan around them.
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm">
            <Link to="/about-the-data" className="text-muted underline underline-offset-2 hover:text-fg">
              More about the data
            </Link>
          </p>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-border py-12">
          <p className={eyebrow}>FAQ</p>
          <h2 id="faq-title" className={h2}>
            Questions, answered
          </h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faq.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-medium">{f.q}</h3>
                  <span
                    aria-hidden
                    className="font-mono text-accent transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="pb-10">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
