import { Link } from "@tanstack/react-router";

const link = "underline underline-offset-2 hover:text-fg";

/** Crawlable footer for the server-rendered pages: every hub reachable from every page. */
export function SiteFooter({ attribution }: { attribution?: string }) {
  return (
    <footer className="mt-12 border-t border-border pt-5 text-[11px] leading-relaxed text-subtle">
      <p>
        <Link to="/" className={link}>
          Map
        </Link>
        {" · "}
        <Link to="/from" className={link}>
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
      </p>
      {attribution ? (
        <p className="mt-2">
          {attribution}. Distances are great-circle; durations are estimates (km ÷ 850 km/h + 30
          min). Not a timetable.
        </p>
      ) : null}
    </footer>
  );
}
