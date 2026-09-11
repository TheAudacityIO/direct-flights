import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · FlyDirectFrom" },
      {
        name: "description",
        content: "What FlyDirectFrom stores, what it never collects, and your rights.",
      },
    ],
    links: [{ rel: "canonical", href: "https://flydirectfrom.com/privacy" }],
  }),
  component: PrivacyPage,
});

const UPDATED = "2026-09-11";

function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">FlyDirectFrom</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">Privacy</h1>
      <p className="mt-1 text-sm text-muted">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-medium text-fg">Who runs this site</h2>
          <p className="mt-2">
            FlyDirectFrom is operated by The Audacity (Miguel Tineo, sole trader, Italy). For any
            privacy request, reach out via{" "}
            <a href="https://miketineo.com" className="underline underline-offset-2 hover:text-fg">
              miketineo.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">What we collect</h2>
          <p className="mt-2">
            No accounts, no sign-up, no tracking pixels, no analytics scripts. The site keeps small
            interface preferences (such as your last searched airport) in your browser&apos;s local
            storage; that data never leaves your device.
          </p>
          <p className="mt-2">
            Like every website, our infrastructure sees standard request metadata (IP address, user
            agent, requested URL) in server logs used for security and operations. Traffic is
            proxied through Cloudflare, whose systems process the same metadata to serve and protect
            the site.
          </p>
          <p className="mt-2">
            The map background is loaded from OpenFreeMap&apos;s public tile servers (OpenStreetMap
            data), so your browser requests map tiles directly from them; their servers see your IP
            address like any content delivery network would.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Advertising</h2>
          <p className="mt-2">
            FlyDirectFrom is free and plans to fund itself with restrained display advertising
            (Google AdSense). Before any personalized ads are shown to visitors in the EEA, UK or
            Switzerland, a Google-certified consent dialog will ask for your choice, and you can
            refuse. Until that consent tooling ships, no ad scripts are loaded at all.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Your rights</h2>
          <p className="mt-2">
            Under the GDPR you can request access, correction or deletion of personal data, object
            to processing, and complain to your supervisory authority. Since we hold no account data
            about you, most requests concern server logs, which rotate automatically.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Data sources</h2>
          <p className="mt-2">
            Route data combines the OpenFlights dataset with a current-route overlay from
            AeroDataBox. It describes airline networks, not people, and is not personal data.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link to="/" className="underline underline-offset-2 text-muted hover:text-fg">
          Back to the map
        </Link>
      </p>
      <SiteFooter />
    </main>
  );
}
