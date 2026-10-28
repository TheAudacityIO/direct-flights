import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ProvenanceChip } from "@/components/explorer/ProvenanceChip";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AdSlot } from "@/components/ads/AdSlot";
import { PlanTrip } from "@/components/ads/PlanTrip";
import { AD_SLOTS } from "@/lib/ads/config";
import { carsCovered, isAffiliate, partnerRel, partnerUrl } from "@/lib/affiliates";
import { ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";
import { formatDuration, formatKm } from "@/lib/flights/geo";
import { formatDays } from "@/lib/flights/observed";
import { getAirportPage } from "@/lib/flights/pages";
import { getAirportPosts } from "@/lib/blog/pages";
import {
  airportCrumbs,
  airportGlance,
  airportLabel,
  airportPageDescription,
  airportPageJsonLd,
  airportPagePath,
  airportPageTitle,
  airlinesByRoutes,
  airportLastmod,
  archiveAirportPageDescription,
  archiveAirportPageTitle,
  breadcrumbJsonLd,
  countrySlug,
  jsonLdScript,
  observedSentence,
  pageMeta,
  provenanceSentence,
  SITE_ORIGIN,
} from "@/lib/flights/seo";
import goneAirports from "../../data/search/gone-airports.json";

export const Route = createFileRoute("/from/$iata")({
  loader: async ({ params }) => {
    const iata = params.iata.toUpperCase();
    if (iata !== params.iata) {
      throw redirect({ to: "/from/$iata", params: { iata }, statusCode: 301 });
    }
    const [page, posts] = await Promise.all([
      getAirportPage({ data: iata }),
      getAirportPosts({ data: iata }),
    ]);
    if (!page) {
      // Airports cut from the dataset in Sept 2026 keep a country to send search traffic to.
      const slug = (goneAirports.airports as Record<string, string>)[iata];
      if (slug) throw redirect({ to: "/countries/$slug", params: { slug }, statusCode: 301 });
      throw notFound();
    }
    return { ...page, posts };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Airport not found · FlyDirectFrom" }] };
    const { origin, destinations, observed, indexable, meta } = loaderData;
    const title = observed
      ? airportPageTitle(origin, destinations.length)
      : archiveAirportPageTitle(origin, destinations.length);
    return {
      meta: [
        ...pageMeta(
          title,
          observed
            ? airportPageDescription(origin, destinations)
            : archiveAirportPageDescription(origin, destinations),
          airportPagePath(origin.iata),
        ),
        ...(indexable ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: [{ rel: "canonical", href: SITE_ORIGIN + airportPagePath(origin.iata) }],
      scripts: [
        jsonLdScript(breadcrumbJsonLd(airportCrumbs(origin))),
        jsonLdScript(airportPageJsonLd(origin, title, airportLastmod(observed, meta))),
      ],
    };
  },
  notFoundComponent: NotFoundPage,
  component: AirportPage,
});

function NotFoundPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">FlyDirectFrom</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">No nonstop routes here</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        That airport code has no nonstop departures in our dataset.{" "}
        <Link to="/from" className="underline underline-offset-2 hover:text-fg">
          Browse every airport
        </Link>{" "}
        or{" "}
        <Link to="/" className="underline underline-offset-2 hover:text-fg">
          search the map
        </Link>
        .
      </p>
      <SiteFooter />
    </main>
  );
}

function AirportPage() {
  const { origin, destinations, observed, nearby, alternatives, pageless, meta, posts } = Route.useLoaderData();
  const answer = observed ? observedSentence(origin, destinations, meta) : null;
  const noPage = new Set(pageless);
  const glance = airportGlance(destinations);
  const airlines = airlinesByRoutes(destinations);
  // The dataset sorts by rounded minutes; km is the same order without the ties.
  const rows = destinations.slice().sort((a, b) => a.km - b.km || a.iata.localeCompare(b.iata));
  const countries = glance.countries;
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
        {" / "}
        <Link to="/from" activeOptions={{ exact: true }} className="hover:text-fg">
          Airports
        </Link>
        {" / "}
        <Link to="/countries/$slug" params={{ slug: countrySlug(origin.country) }} className="hover:text-fg">
          {origin.country}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg text-balance">
        Direct flights from {origin.city || origin.name}{" "}
        <span className="font-mono text-accent">{origin.iata}</span>
      </h1>
      {answer ? <p className="mt-2 text-base text-fg">{answer}</p> : null}
      <p className="mt-2 text-sm text-muted">
        {airportLabel(origin)}, {origin.country}. {destinations.length} nonstop{" "}
        {destinations.length === 1 ? "destination" : "destinations"} in {countries}{" "}
        {countries === 1 ? "country" : "countries"}.
      </p>
      <p className="mt-1 text-xs text-subtle">{provenanceSentence(destinations, meta)}</p>
      {glance.verified === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
          <strong className="text-fg">Historical schedule data.</strong> These routes come from the
          OpenFlights archive, last updated around 2014, and we have not seen them operate
          recently. Check with the airline before you plan around one.
        </p>
      ) : null}
      <p className="mt-4">
        <Link
          to="/"
          search={{ from: origin.iata, to: undefined }}
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-fg hover:bg-surface-2"
        >
          Open {origin.iata} on the map
        </Link>
      </p>

      <AdSlot slot={AD_SLOTS.airportPage} minHeight={120} className="mt-6" />

      <p className="mt-8 text-xs text-subtle">
        &ldquo;Fares&rdquo; opens a fare search for that nonstop on Kiwi.com. Some links may earn us a
        commission at no extra cost to you.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted whitespace-nowrap">
              <th className="py-2 pr-3 font-medium">Destination</th>
              <th className="py-2 pr-3 font-medium">Airlines</th>
              <th className="py-2 pr-3 text-right font-medium">Distance</th>
              <th className="py-2 pr-3 text-right font-medium">Time</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const days = formatDays(d.days);
              const label = (
                <>
                  {d.city || d.name}{" "}
                  <span className="font-mono text-[13px] text-accent">{d.iata}</span>
                </>
              );
              return (
                <tr key={d.iata} className="border-b border-border/60 align-top">
                  <td className="py-2.5 pr-3 [overflow-wrap:anywhere]">
                    {noPage.has(d.iata) ? (
                      <span className="text-fg">{label}</span>
                    ) : (
                      <Link
                        to="/from/$iata"
                        params={{ iata: d.iata }}
                        className="text-fg hover:underline underline-offset-2"
                      >
                        {label}
                      </Link>
                    )}
                    <span className="block text-xs text-muted">
                      {d.name}, {d.country}
                    </span>
                    <a
                      href={partnerUrl("flights", { origin: origin.iata, destination: d.iata })}
                      target="_blank"
                      rel={partnerRel(isAffiliate("flights"))}
                      onClick={() =>
                        track("affiliate_click", {
                          partner: "flights",
                          placement: "airport_table",
                          page: window.location.pathname,
                          destination: d.iata,
                          affiliate: isAffiliate("flights"),
                        })
                      }
                      className="mt-1 inline-flex min-h-6 items-center gap-1 text-xs text-accent underline underline-offset-2 hover:text-fg"
                    >
                      Fares
                      <ExternalLink className="size-3" strokeWidth={1.75} aria-hidden />
                    </a>
                  </td>
                  <td className="py-2.5 pr-3 text-muted [overflow-wrap:anywhere]">
                    {d.airlines.length > 0 ? d.airlines.join(", ") : "Airline unknown"}
                    {days ? <span className="block text-xs text-subtle">{days}</span> : null}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-muted whitespace-nowrap">
                    {formatKm(d.km)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-fg whitespace-nowrap">
                    {formatDuration(d.minutes)}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <ProvenanceChip dest={d} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="text-base font-medium text-fg">At a glance</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Stat label="Nonstop destinations" value={String(destinations.length)} />
          <Stat label="Countries served" value={String(countries)} />
          <Stat label="Airlines" value={String(glance.airlines)} />
          {glance.longest ? (
            <Stat
              label="Longest route"
              value={`${glance.longest.city || glance.longest.name} (${glance.longest.iata}), ${formatKm(glance.longest.km)}`}
            />
          ) : null}
          {glance.shortest ? (
            <Stat
              label="Shortest route"
              value={`${glance.shortest.city || glance.shortest.name} (${glance.shortest.iata}), ${formatKm(glance.shortest.km)}`}
            />
          ) : null}
          <Stat
            label="Verified current"
            value={`${glance.verified} of ${destinations.length}`}
          />
        </dl>
      </section>

      <div className="mt-10">
        <PlanTrip
          partners={carsCovered(origin.country) ? ["transfers", "cars", "esim"] : ["transfers", "esim"]}
          origin={origin.iata}
          country={origin.country}
          placement="airport_page"
          title={`Before you fly from ${origin.city || origin.name}`}
        />
      </div>

      {airlines.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-fg">
            Airlines flying nonstop from {origin.city || origin.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {airlines.map((a, i) => (
              <span key={a.airline}>
                {i > 0 ? ", " : ""}
                <span className="text-fg">{a.airline}</span> ({a.routes})
              </span>
            ))}
            . The number is how many of the destinations above each airline flies.
          </p>
        </section>
      ) : null}

      {nearby.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-fg">Nearby departure airports</h2>
          <p className="mt-1 text-xs text-subtle">
            Other origins within 400 km of {origin.iata}, nearest first.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {nearby.map((ap) => (
              <li key={ap.iata}>
                <Link
                  to="/from/$iata"
                  params={{ iata: ap.iata }}
                  onClick={() => track("nearby_alt_click", { from: origin.iata, to: ap.iata, km: ap.km })}
                  className="text-muted hover:text-fg hover:underline underline-offset-2"
                >
                  {ap.city || ap.name} <span className="font-mono text-accent">{ap.iata}</span>{" "}
                  <span className="text-subtle">
                    {formatKm(ap.km)} · {ap.destinations}{" "}
                    {ap.destinations === 1 ? "destination" : "destinations"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {alternatives.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-fg">Nonstops a short drive away</h2>
          <p className="mt-1 text-xs text-subtle">
            Observed in the 30 days to {meta.windowTo ?? "the last refresh"}. Drive times are
            straight-line estimates, not directions.
          </p>
          <div className="mt-3 space-y-4">
            {alternatives.map((b) => (
              <div key={b.iata}>
                <p className="text-sm text-fg">
                  {b.city || b.name} <span className="font-mono text-accent">{b.iata}</span>{" "}
                  <span className="text-subtle">
                    · {b.miles} mi ({b.km} km) · {b.drive}
                  </span>
                </p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {b.routes.map((r) => (
                    <li key={r.iata}>
                      <Link
                        to="/"
                        search={{ from: b.iata, to: r.iata }}
                        title={r.airlines.join(", ")}
                        onClick={() =>
                          track("nearby_alt_click", { from: origin.iata, to: b.iata, dest: r.iata, km: b.km })
                        }
                        className="text-muted hover:text-fg hover:underline underline-offset-2"
                      >
                        {r.city || r.iata} <span className="font-mono text-accent">{r.iata}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-fg">From the blog</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="text-fg hover:underline underline-offset-2"
                >
                  {p.title}
                </Link>
                <span className="block text-xs text-subtle">{p.description}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-fg">About these routes</h2>
        <p className="mt-2">
          Rows marked Verified were seen operating in the {meta.lookbackDays ?? 30} days to{" "}
          {meta.windowTo ?? "the last refresh"}. Rows marked Archive come from the OpenFlights route
          archive (around 2014); we remove the airlines we know have folded, but a route can still
          have changed since, so treat those rows as a starting point and confirm with the airline
          before booking.{" "}
          <Link to="/about-the-data" className="underline underline-offset-2 hover:text-fg">
            How the data is built
          </Link>
          .
        </p>
      </section>

      <AdSlot slot={AD_SLOTS.airportPage} className="mt-10" />

      <SiteFooter attribution={meta.attribution} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}
