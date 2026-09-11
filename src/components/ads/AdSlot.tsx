import { useEffect, useRef } from "react";
import { ADS_ENABLED, ADSENSE_CLIENT } from "@/lib/ads/config";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  /** AdSense unit id; empty until units exist, which renders the reserved space instead. */
  slot: string;
  /** Reserved height so the page does not jump when the ad fills. */
  minHeight?: number;
  className?: string;
};

/**
 * One display ad space. Never placed over the map; always below or beside
 * content with its height reserved up front (CLS) and an "Advertisement"
 * label (AdSense labelling policy).
 */
export function AdSlot({ slot, minHeight = 250, className }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const live = ADS_ENABLED && slot !== "";

  useEffect(() => {
    if (!live || !ref.current || ref.current.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* blocked or not loaded: the reserved space stays empty */
    }
  }, [live]);

  if (!ADS_ENABLED) return null;

  return (
    <aside
      aria-label="Advertisement"
      className={cn("w-full", className)}
      data-ad-space={live ? "live" : "reserved"}
    >
      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-subtle">Advertisement</p>
      {live ? (
        <ins
          ref={ref}
          className="adsbygoogle block"
          style={{ display: "block", minHeight }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md border border-dashed border-border text-[11px] text-subtle"
          style={{ minHeight }}
        >
          Ad space reserved
        </div>
      )}
    </aside>
  );
}
