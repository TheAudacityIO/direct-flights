import { createFileRoute, Link } from "@tanstack/react-router";
import { getAirportIndex, type AirportIndexEntry } from "@/lib/flights/pages";
import { SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/from/")({
  loader: () => getAirportIndex(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "Direct flights by departure airport · FlyDirectFrom" },
      {
        name: "description",
        content: `Every departure airport with nonstop routes in our dataset (${
          loaderData?.airports.length ?? ""
        } airports), grouped by country. Pick one to see where you can fly direct.`,
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/from` }],
  }),
  component: AirportIndexPage,
});

function groupByCountry(airports: AirportIndexEntry[]): [string, AirportIndexEntry[]][] {
  const groups = new Map<string, AirportIndexEntry[]>();
  for (const ap of airports) {
    const list = groups.get(ap.country) ?? [];
    list.push(ap);
    groups.set(ap.country, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function AirportIndexPage() {
  const { airports, meta } = Route.useLoaderData();
  const groups = groupByCountry(airports);
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">
        Direct flights by departure airport
      </h1>
      <p className="mt-2 text-sm text-muted">
        {airports.length} airports with nonstop routes, grouped by country. Each page lists every
        destination with airlines, distance and estimated time.
      </p>
      <p className="mt-1 text-xs text-subtle">{meta.note}</p>

      <div className="mt-8 space-y-6">
        {groups.map(([country, list]) => (
          <section key={country}>
            <h2 className="text-sm font-medium text-fg">{country}</h2>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {list.map((ap) => (
                <li key={ap.iata}>
                  <Link
                    to="/from/$iata"
                    params={{ iata: ap.iata }}
                    className="text-muted hover:text-fg hover:underline underline-offset-2"
                  >
                    {ap.city || ap.name} <span className="font-mono text-accent">{ap.iata}</span>{" "}
                    <span className="text-subtle">{ap.destinations}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
