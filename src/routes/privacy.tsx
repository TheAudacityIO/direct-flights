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

const UPDATED = "2026-10-13";
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
            There are no accounts and nothing to sign up for. We count visits with cookieless
            analytics that store nothing in your browser. The site writes at most two things to your
            browser&apos;s local storage, and neither ever leaves your device: a 30-minute timer when
            you unlock booking details (<code>fdf.unlock.until</code>), and your home airport code,
            only if you press &quot;Remember as my airport&quot; (<code>fdf.homeAirport</code>; press
            Forget to remove it). Suggested airports on the map follow your device&apos;s time zone,
            which is read in your browser and not sent to us. Ads are served by Google, and in
            Europe Google asks for your consent first.
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
            To learn which pages are useful and where visitors come from, the site sends PostHog
            (hosted in the EU) the page you view, the referring site, your browser and device type,
            and the fare-search links you click. Two more events carry no personal data: an
            &quot;article_read&quot; event when you scroll past three quarters of a blog post (the
            post and its category), and an &quot;affiliate_click&quot; event when you follow a
            partner link (which partner, where on the page, the destination, and whether it was an
            affiliate link). PostHog anonymises your IP address, and nothing is
            stored in your browser, so there is no identifier that follows you between visits. This
            rests on our legitimate interest in improving the site.
          </p>
          <p className="mt-2">
            The map background (OpenStreetMap data, packaged by Protomaps) is served from our own
            server at tiles.flydirectfrom.com, behind the same Cloudflare setup, so no third-party
            tile provider sees your requests.
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
            Some links to partners (fare searches, hotels, activities, eSIMs, travel insurance,
            flight compensation, airport transfers and car rental) are affiliate links: if you book
            through one, the partner may pay us a commission at no extra cost to you. They are
            marked as sponsored in the page code, and blog posts and airport pages say so next to
            them. Following any partner link takes you to that
            partner&apos;s site, which may set its own cookies once you arrive (for example to
            credit the referral); that is governed by the partner&apos;s privacy and cookie
            policies, not ours. Nothing is set on this site before you click.
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
