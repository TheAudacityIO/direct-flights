import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ProvenanceChip } from "@/components/explorer/ProvenanceChip";
import { formatDuration, formatKm } from "@/lib/flights/geo";
import { formatDays } from "@/lib/flights/observed";
import { getAirportPage } from "@/lib/flights/pages";
import {
  airportLabel,
  airportPageDescription,
  airportPagePath,
  airportPageTitle,
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
    if (!loaderData) return {};
    const { origin, destinations } = loaderData;
    return {
      meta: [
        { title: `${airportPageTitle(origin, destinations.length)} · FlyDirectFrom` },
        { name: "description", content: airportPageDescription(origin, destinations) },
      ],
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
    </main>
  );
}

function AirportPage() {
  const { origin, destinations, meta } = Route.useLoaderData();
  const countries = new Set(destinations.map((d) => d.country)).size;
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
        {" / "}
        <Link to="/from" className="hover:text-fg">
          Airports
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

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-subtle">
              <th className="py-2 pr-3 font-medium">Destination</th>
              <th className="py-2 pr-3 font-medium">Airlines</th>
              <th className="py-2 pr-3 text-right font-medium">Distance</th>
              <th className="py-2 pr-3 text-right font-medium">Est. time</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((d) => {
              const days = formatDays(d.days);
              return (
                <tr key={d.iata} className="border-b border-border/60 align-top">
                  <td className="py-2.5 pr-3">
                    <Link
                      to="/from/$iata"
                      params={{ iata: d.iata }}
                      className="text-fg hover:underline underline-offset-2"
                    >
                      {d.city || d.name}{" "}
                      <span className="font-mono text-[13px] text-accent">{d.iata}</span>
                    </Link>
                    <span className="block text-xs text-muted">
                      {d.name}, {d.country}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-muted">
                    {d.airlines.length > 0 ? d.airlines.join(", ") : "Airline unknown"}
                    {days ? <span className="block text-xs text-subtle">{days}</span> : null}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-muted">
                    {formatKm(d.km)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-fg">
                    {formatDuration(d.minutes)}
                  </td>
                  <td className="py-2.5">
                    <ProvenanceChip dest={d} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-subtle">
        {meta.attribution}. Distances are great-circle; durations are estimates (km ÷ 850 km/h + 30
        min).{" "}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-fg">
          Privacy
        </Link>
      </p>
    </main>
  );
}
