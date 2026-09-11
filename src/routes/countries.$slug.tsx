import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCountryPage } from "@/lib/flights/pages";
import { countryPagePath, countryPageTitle, SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/countries/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug.toLowerCase();
    if (slug !== params.slug) {
      throw redirect({ to: "/countries/$slug", params: { slug }, statusCode: 301 });
    }
    const page = await getCountryPage({ data: slug });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { country, airports } = loaderData;
    const top = airports.slice(0, 3).map((a) => `${a.city || a.name} (${a.iata})`);
    return {
      meta: [
        { title: `${countryPageTitle(country, airports.length)} · FlyDirectFrom` },
        {
          name: "description",
          content: `Where can you fly direct from ${country}? ${airports.length} ${
            airports.length === 1 ? "airport" : "airports"
          } with nonstop routes, led by ${top.join(", ")}. Every destination, airline and estimated flight time per airport.`,
        },
      ],
      links: [{ rel: "canonical", href: SITE_ORIGIN + countryPagePath(country) }],
    };
  },
  notFoundComponent: NotFoundPage,
  component: CountryPage,
});

function NotFoundPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">FlyDirectFrom</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        No country by that name has nonstop departures in our dataset.{" "}
        <Link to="/from" className="underline underline-offset-2 hover:text-fg">
          Browse every country
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

function CountryPage() {
  const { country, airports, meta } = Route.useLoaderData();
  const routes = airports.reduce((n, a) => n + a.destinations, 0);
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
        {" / "}
        <Link to="/from" className="hover:text-fg">
          Countries
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg text-balance">
        Direct flights from {country}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {airports.length} {airports.length === 1 ? "airport" : "airports"} with nonstop routes,{" "}
        {routes} destination links in total, best-connected first. Open an airport for every direct
        destination with airlines, distance and estimated flight time.
      </p>
      <p className="mt-1 text-xs text-subtle">{meta.note}</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-subtle">
              <th className="py-2 pr-3 font-medium">Airport</th>
              <th className="py-2 pr-3 font-medium">City</th>
              <th className="py-2 text-right font-medium">Nonstop destinations</th>
            </tr>
          </thead>
          <tbody>
            {airports.map((ap) => (
              <tr key={ap.iata} className="border-b border-border/60 align-top">
                <td className="py-2.5 pr-3">
                  <Link
                    to="/from/$iata"
                    params={{ iata: ap.iata }}
                    className="text-fg hover:underline underline-offset-2"
                  >
                    {ap.name} <span className="font-mono text-[13px] text-accent">{ap.iata}</span>
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-muted">{ap.city}</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-fg">
                  {ap.destinations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SiteFooter attribution={meta.attribution} />
    </main>
  );
}
