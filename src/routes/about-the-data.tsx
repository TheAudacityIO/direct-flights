import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getDatasetMeta } from "@/lib/flights/pages";
import { SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/about-the-data")({
  loader: () => getDatasetMeta(),
  head: () => ({
    meta: [
      { title: "About the data · FlyDirectFrom" },
      {
        name: "description",
        content:
          "Where FlyDirectFrom's nonstop routes come from, what Verified and Archive mean, how distances and flight times are estimated, and what the site does not claim.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/about-the-data` }],
  }),
  component: AboutTheDataPage,
});

const link = "underline underline-offset-2 hover:text-fg";

function AboutTheDataPage() {
  const meta = Route.useLoaderData();
  const generated = meta.generatedAt.slice(0, 10);
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">About the data</h1>
      <p className="mt-1 text-sm text-muted">Dataset built {generated}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-medium text-fg">What the site answers</h2>
          <p className="mt-2">
            One question: from a given airport, where can you fly without changing planes? Every
            page lists nonstop city pairs with the airlines that fly them, the great-circle distance
            and an estimated block time. The site is not a timetable, a fare search or a booking
            tool; it tells you which direct routes exist so you can search them on the airline&apos;s
            own site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Two sources, two labels</h2>
          <p className="mt-2">
            <strong className="text-fg">Verified</strong> rows were observed operating in the{" "}
            {meta.lookbackDays ?? 30} days to {meta.windowTo ?? "the last refresh"}, from{" "}
            <a href="https://aerodatabox.com" className={link}>
              AeroDataBox
            </a>{" "}
            daily route statistics. Coverage grows airport by airport each month; a route observed
            from A to B is also shown as B to A.
          </p>
          <p className="mt-2">
            <strong className="text-fg">Archive</strong> rows come from the{" "}
            <a href="https://openflights.org/data.html" className={link}>
              OpenFlights route archive
            </a>
            , a community dataset last updated around 2014. It is the widest public map of airline
            networks that exists, and it is old: routes have been added and dropped since. We remove
            carriers that have ceased operating, rename brands absorbed by a successor to the name
            you book under, and keep the rest with the Archive label so you know to confirm before
            planning around it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Distances and flight times</h2>
          <p className="mt-2">
            Distance is the great-circle distance between the two airports&apos; coordinates.
            Estimated time is that distance at 850 km/h plus 30 minutes for taxi, climb and descent.
            Real block times vary with aircraft, winds and routing; long-haul westbound flights in
            particular run longer than the estimate.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">What is not here</h2>
          <p className="mt-2">
            No prices, no seat availability, no flight numbers, no departure times, and no claim
            that a route operates on a given date. Airlines that fly seasonally appear as a route
            without a season. If a route matters to your plans, check it with the airline.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Refresh and corrections</h2>
          <p className="mt-2">
            The dataset is rebuilt monthly. Airport and route data © OpenFlights.org; current-route
            overlay via AeroDataBox. Spotted a route that no longer exists, or a missing one?{" "}
            <a href="https://miketineo.com" className={link}>
              Tell us
            </a>
            .
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
