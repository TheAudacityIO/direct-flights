import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getDatasetMeta } from "@/lib/flights/pages";
import { pageMeta, SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/about-the-data")({
  loader: () => getDatasetMeta(),
  head: () => ({
    meta: pageMeta(
      "About the data · FlyDirectFrom",
      "Where FlyDirectFrom's nonstop routes come from, what Verified and Archive mean, how distances and flight times are estimated, and what the site does not claim.",
      "/about-the-data",
    ),
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
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">About the data</h1>
      <p className="mt-1 text-sm text-muted">Dataset built {generated}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-medium text-fg">The one question</h2>
          <p className="mt-2">
            From this airport, where can I fly without changing planes? That is all the site tries
            to answer. Each airport page lists the nonstop routes we know about, who flies them,
            how far it is and roughly how long it takes. It is not a timetable and it does not sell
            tickets. Once you know a direct route exists, search it on the airline&apos;s site or
            through the fare-search links on the map.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Why some rows say Verified and others say Archive</h2>
          <p className="mt-2">
            <strong className="text-fg">Verified</strong> means we saw the route actually operate in
            the {meta.lookbackDays ?? 30} days up to {meta.windowTo ?? "the last refresh"}. That
            comes from{" "}
            <a href="https://aerodatabox.com" className={link}>
              AeroDataBox
            </a>
            , which counts real departures per route. We add airports to this check a few at a time
            every month, and if we saw a flight from A to B we also list it from B to A.
          </p>
          <p className="mt-2">
            <strong className="text-fg">Archive</strong> means the row comes from the{" "}
            <a href="https://openflights.org/data.html" className={link}>
              OpenFlights route archive
            </a>
            , a community dataset that stopped being updated around 2014. It is still the widest
            public map of who flies where, and it is also old: routes have been launched and
            dropped since. We take out the airlines we know have gone out of business, rename
            brands that were absorbed by another airline to the name you would book under today,
            and label the rest Archive so you know to double-check before you plan around it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Distance and estimated time</h2>
          <p className="mt-2">
            Distance is the great-circle line between the two airports. The estimated time is
            gate to gate: that distance at 850 km/h plus 30 minutes for taxiing, climb and descent.
            Real flights differ with the aircraft, the winds and the routing; long westbound flights
            in particular run longer than our number.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">What you will not find here</h2>
          <p className="mt-2">
            Prices, seats, flight numbers, departure times, or any promise that a route runs on a
            specific day. Seasonal routes show up as routes, without the season. If a route matters
            to your plans, confirm it with the airline.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Updates and corrections</h2>
          <p className="mt-2">
            The dataset is rebuilt once a month. Airport and route data © OpenFlights.org;
            current-route overlay via AeroDataBox. Found a route that no longer flies, or one we
            are missing? Tell us through{" "}
            <a href="https://theaudacity.io" className={link}>
              theaudacity.io
            </a>
            .
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
