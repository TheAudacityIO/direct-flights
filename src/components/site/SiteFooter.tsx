import { Link } from "@tanstack/react-router";
import { ADS_ENABLED } from "@/lib/ads/config";

const link = "underline underline-offset-2 hover:text-fg";

declare global {
  interface Window {
    googlefc?: {
      callbackQueue?: Array<Record<string, () => void>>;
      showRevocationMessage?: () => void;
    };
  }
}

/** Re-opens Google's consent dialog so an EEA visitor can withdraw or change their choice. */
function reopenConsent() {
  const fc = (window.googlefc = window.googlefc ?? {});
  fc.callbackQueue = fc.callbackQueue ?? [];
  fc.callbackQueue.push({ CONSENT_DATA_READY: () => fc.showRevocationMessage?.() });
}

/** Crawlable footer for the server-rendered pages: every hub reachable from every page. */
export function SiteFooter({ attribution }: { attribution?: string }) {
  return (
    <footer className="mt-12 border-t border-border pt-5 text-[11px] leading-relaxed text-muted">
      <p>
        <Link to="/" className={link}>
          Map
        </Link>
        {" · "}
        <Link to="/from" activeOptions={{ exact: true }} className={link}>
          Airports by country
        </Link>
        {" · "}
        <Link to="/about-the-data" className={link}>
          About the data
        </Link>
        {" · "}
        <Link to="/privacy" className={link}>
          Privacy
        </Link>
        {ADS_ENABLED ? (
          <>
            {" · "}
            <button type="button" onClick={reopenConsent} className={link}>
              Ad choices
            </button>
          </>
        ) : null}
      </p>
      {attribution ? (
        <p className="mt-2 text-subtle">
          {attribution}. Distances are great-circle; durations are estimates (km ÷ 850 km/h + 30
          min). Not a timetable.
        </p>
      ) : null}
    </footer>
  );
}
