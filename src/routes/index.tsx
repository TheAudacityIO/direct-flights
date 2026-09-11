import { createFileRoute } from "@tanstack/react-router";
import { Explorer, type ExplorerSearch } from "@/components/explorer/Explorer";

function parseIata(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : undefined;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Direct flights from any airport, on one map · FlyDirectFrom" },
      {
        name: "description",
        content:
          "Where can you fly direct? Pick an airport and see every nonstop destination with airlines, distance and estimated flight time. Free, fast, no clutter.",
      },
    ],
    links: [{ rel: "canonical", href: "https://flydirectfrom.com/" }],
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

  return (
    <Explorer
      search={search}
      onSearchChange={(next) => {
        void navigate({ search: next, replace: true });
      }}
    />
  );
}
