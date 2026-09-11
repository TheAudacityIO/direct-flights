import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCountryIndex } from "@/lib/flights/pages";
import { SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/from/")({
  loader: () => getCountryIndex(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "Direct flights by country and departure airport · FlyDirectFrom" },
      {
        name: "description",
        content: `Nonstop routes from ${
          loaderData?.countries.reduce((n, c) => n + c.airports, 0) ?? ""
        } airports in ${
          loaderData?.countries.length ?? ""
        } countries. Pick a country, then an airport, to see every direct destination with airlines, distance and estimated time.`,
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/from` }],
  }),
  component: CountryHubPage,
});

function CountryHubPage() {
  const { countries, meta } = Route.useLoaderData();
  const airportCount = countries.reduce((n, c) => n + c.airports, 0);
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
        {airportCount} airports with nonstop routes in {countries.length} countries, best-connected
        first. Each country page lists every airport; each airport page lists every destination
        with airlines, distance and estimated time.
      </p>
      <p className="mt-1 text-xs text-subtle">{meta.note}</p>

      <div className="mt-8 space-y-5">
        {countries.map((c) => (
          <section key={c.slug}>
            <h2 className="text-sm font-medium text-fg">
              <Link
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="hover:underline underline-offset-2"
              >
                {c.country}
              </Link>{" "}
              <span className="font-normal text-subtle">
                {c.airports} {c.airports === 1 ? "airport" : "airports"}
              </span>
            </h2>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {c.top.map((ap) => (
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
              {c.airports > c.top.length ? (
                <li>
                  <Link
                    to="/countries/$slug"
                    params={{ slug: c.slug }}
                    className="text-subtle hover:text-fg hover:underline underline-offset-2"
                  >
                    all {c.airports} in {c.country} →
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>

      <SiteFooter attribution={meta.attribution} />
    </main>
  );
}
