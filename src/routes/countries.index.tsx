import { createFileRoute, redirect } from "@tanstack/react-router";

/** The country directory lives on /from; keep the parent path from dead-ending. */
export const Route = createFileRoute("/countries/")({
  beforeLoad: () => {
    throw redirect({ to: "/from", statusCode: 301 });
  },
});
