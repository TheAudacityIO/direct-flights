import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { pageMeta } from "@/lib/flights/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: pageMeta(
      "Privacy · FlyDirectFrom",
      "What FlyDirectFrom stores, what it never collects, how ads work here, and your rights.",
      "/privacy",
    ),
    links: [{ rel: "canonical", href: "https://flydirectfrom.com/privacy" }],
  }),
  component: PrivacyPage,
});

const UPDATED = "2026-09-12";
const link = "underline underline-offset-2 hover:text-fg";

function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">Privacy</h1>
      <p className="mt-1 text-sm text-muted">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-medium text-fg">Who runs this site</h2>
          <p className="mt-2">
            FlyDirectFrom is made and run by{" "}
            <a href="https://theaudacity.io" className={link}>
              The Audacity
            </a>
            , a software studio based in Italy. The Audacity owns the site and is the data
            controller for anything described below. Questions or requests: contact us through
            theaudacity.io; we answer within 30 days as the GDPR requires.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">The short version</h2>
          <p className="mt-2">
            There are no accounts and nothing to sign up for. We do not run analytics. The only
            thing the site writes to your browser is a 30-minute timer when you unlock booking
            details, and that never leaves your device. Ads are served by Google, and in Europe
            Google asks for your consent first.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">What reaches our servers</h2>
          <p className="mt-2">
            The same thing every website sees: your IP address, browser type and the page you asked
            for, kept in server logs for up to 14 days so we can keep the site up and fend off
            abuse (our legitimate interest in running it). The site sits behind Cloudflare, which
            handles that same request data to deliver and protect it.
          </p>
          <p className="mt-2">
            The map background comes straight from OpenFreeMap&apos;s tile servers (OpenStreetMap
            data), so your browser fetches those tiles from them directly and they see your IP
            address the way any content network would.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Ads</h2>
          <p className="mt-2">
            The site is free and pays for itself with ads from Google AdSense. Google may use
            cookies or similar identifiers to show ads and measure them; the details are in{" "}
            <a href="https://policies.google.com/technologies/ads" className={link}>
              Google&apos;s advertising policy
            </a>
            . Third-party vendors, Google included, use cookies to show ads based on your earlier
            visits to this and other websites. You can opt out of personalised advertising in{" "}
            <a href="https://adssettings.google.com" className={link}>
              Google Ads Settings
            </a>{" "}
            or at{" "}
            <a href="https://www.aboutads.info/choices/" className={link}>
              aboutads.info
            </a>{" "}
            and{" "}
            <a href="https://www.youronlinechoices.eu" className={link}>
              youronlinechoices.eu
            </a>
            ; how Google uses data from sites that use its services is explained{" "}
            <a href="https://policies.google.com/technologies/partner-sites" className={link}>
              here
            </a>
            .
          </p>
          <p className="mt-2">
            If you are in the EEA, the UK or Switzerland, a consent dialog from Google appears
            before any personalised ad is shown, and you can say no; you will then see ads that are
            not based on your interests. Personalised ads run on your consent and on nothing else.
            To change or withdraw your choice, use the &quot;Ad choices&quot; link in the footer of
            any page; it reopens the same dialog.
          </p>
          <p className="mt-2">
            Some route details can be unlocked by watching a short ad. Watching one sets a timer in
            your browser&apos;s local storage for 30 minutes and nothing else; skip it and nothing
            changes.
          </p>
          <p className="mt-2">
            Links to fare searches (Google Flights, Skyscanner, Kayak) are plain links. We do not
            earn a commission when you book, and those sites have their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Your rights</h2>
          <p className="mt-2">
            Under the GDPR you can ask what we hold about you, have it corrected or deleted, object
            to how it is used, and complain to your data protection authority. In practice we hold
            no profile of you, so a request usually comes down to server logs, which rotate on
            their own within days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-fg">Route data</h2>
          <p className="mt-2">
            The flights shown here come from the OpenFlights archive and from AeroDataBox. That
            data describes airline networks, not people. How it is put together is on the{" "}
            <Link to="/about-the-data" className={link}>
              about the data
            </Link>{" "}
            page.
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
