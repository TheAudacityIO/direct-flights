import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ProvenanceChip } from "@/components/explorer/ProvenanceChip";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ads/config";
import { formatDuration, formatKm } from "@/lib/flights/geo";
import { formatDays } from "@/lib/flights/observed";
import { getAirportPage } from "@/lib/flights/pages";
import {
  airportGlance,
  airportLabel,
  airportPageDescription,
  airportPagePath,
  airportPageTitle,
  countrySlug,
  pageMeta,
  provenanceSentence,
  SITE_ORIGIN,
} from "@/lib/flights/seo";

export const Route = createFileRoute("/from/$iata")({
  loader: async ({ params }) => {
    const iata = params.iata.toUpperCase();
    if (iata !== params.iata) {
      throw redirect({ to: "/from/$iata", params: { iata }, statusCode: 301 });
    }
    const page = await getAirportPage({ data: iata });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Airport not found · FlyDirectFrom" }] };
    const { origin, destinations } = loaderData;
    return {
      meta: pageMeta(
        `${airportPageTitle(origin, destinations.length)} · FlyDirectFrom`,
        airportPageDescription(origin, destinations),
        airportPagePath(origin.iata),
      ),
      links: [{ rel: "canonical", href: SITE_ORIGIN + airportPagePath(origin.iata) }],
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
  const { origin, destinations, nearby, pageless, meta } = Route.useLoaderData();
  const noPage = new Set(pageless);
  const glance = airportGlance(destinations);
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
      <p className="mt-2 text-sm text-muted">
        {airportLabel(origin)}, {origin.country}. {destinations.length} nonstop{" "}
        {destinations.length === 1 ? "destination" : "destinations"} in {countries}{" "}
        {countries === 1 ? "country" : "countries"}.
      </p>
      <p className="mt-1 text-xs text-subtle">{provenanceSentence(destinations, meta)}</p>
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

      <div className="mt-8 overflow-x-auto">
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
