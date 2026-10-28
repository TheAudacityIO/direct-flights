import { createFileRoute } from "@tanstack/react-router";
import { Explorer, type ExplorerSearch } from "@/components/explorer/Explorer";
import { HomeLanding } from "@/components/site/HomeLanding";
import { faqJsonLd, homeFaq } from "@/lib/flights/home-faq";
import { getDatasetMeta, getPopularOrigins } from "@/lib/flights/pages";
import { jsonLdScript, pageMeta, websiteJsonLd } from "@/lib/flights/seo";

function parseIata(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : undefined;
}

export const Route = createFileRoute("/")({
  loader: async () => {
    const [popular, meta] = await Promise.all([getPopularOrigins(), getDatasetMeta()]);
    // Only what the landing prints; the per-origin lists stay on the server.
    const { observedOriginCodes: _codes, observedAsOf: _asOf, ...landingMeta } = meta;
    return { popular, meta: landingMeta };
  },
  // The popular list and dataset meta are static per deploy; never refetch when only ?from= changes.
  staleTime: Infinity,
  head: ({ loaderData }) => ({
    meta: pageMeta(
      "Direct flights from any airport, on one map · FlyDirectFrom",
      "Where can you fly direct? Pick an airport and see every nonstop destination with airlines, distance and estimated flight time. Free, fast, no clutter.",
      "/",
    ),
    links: [{ rel: "canonical", href: "https://flydirectfrom.com/" }],
    scripts: [
      jsonLdScript(websiteJsonLd()),
      ...(loaderData ? [jsonLdScript(faqJsonLd(homeFaq(loaderData.meta)))] : []),
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): ExplorerSearch => ({
    from: parseIata(raw.from),
    to: parseIata(raw.to),
  }),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { popular, meta } = Route.useLoaderData();

  return (
    <>
      <Explorer
        popular={popular}
        search={search}
        onSearchChange={(next) => {
          void navigate({ search: next, replace: true });
        }}
      />
      <HomeLanding popular={popular} meta={meta} />
    </>
  );
}
