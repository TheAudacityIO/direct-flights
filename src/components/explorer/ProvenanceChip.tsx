import type { Destination } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

/**
 * Where a route's evidence comes from: an observed entry carries `lastSeen`
 * from the AeroDataBox overlay; everything else is the ~2014 OpenFlights
 * baseline with defunct carriers stripped, still unverified as current.
 */
export function ProvenanceChip({
  dest,
  className,
}: {
  dest: Pick<Destination, "lastSeen">;
  className?: string;
}) {
  const verified = Boolean(dest.lastSeen);
  return (
    <span
      title={
        verified
          ? `Seen operating on ${dest.lastSeen}`
          : "From the OpenFlights archive (~2014); not verified as current"
      }
      className={cn(
        "inline-block rounded-sm border px-1 font-mono text-[10px] uppercase tracking-wider",
        verified ? "border-accent-dim text-accent" : "border-border text-subtle",
        className,
      )}
    >
      {verified ? "Verified" : "Archive"}
    </span>
  );
}
