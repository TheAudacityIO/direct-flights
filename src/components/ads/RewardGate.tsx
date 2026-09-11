import { useState } from "react";
import { Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REWARDED_AD_UNIT, UNLOCK_MINUTES } from "@/lib/ads/config";
import { requestReward } from "@/lib/ads/rewarded";
import { grantUnlock, useUnlocked } from "@/lib/ads/unlock";

type Props = {
  /** What the viewer gets: shown blurred while locked. */
  children: React.ReactNode;
  title?: string;
};

/**
 * The rewarded-unlock loop: a short ad buys every booking-details panel for
 * UNLOCK_MINUTES. While no rewarded unit is configured the button still runs
 * the flow and unlocks for free, so the UX is exercised before the ads are.
 */
export function RewardGate({ children, title = "Booking details" }: Props) {
  const unlocked = useUnlocked();
  const [state, setState] = useState<"idle" | "loading" | "dismissed">("idle");

  if (unlocked) return <>{children}</>;

  async function watch() {
    setState("loading");
    const outcome = await requestReward();
    if (outcome === "dismissed") {
      setState("dismissed");
      return;
    }
    grantUnlock();
    setState("idle");
  }

  return (
    <div className="relative">
      <div aria-hidden inert className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-surface/70 p-3 text-center">
        <p className="flex items-center gap-1.5 text-xs text-fg">
          <Lock className="size-3.5" strokeWidth={1.75} aria-hidden />
          {title}
        </p>
        <Button size="sm" onClick={watch} disabled={state === "loading"}>
          <Play className="size-3.5" strokeWidth={1.75} aria-hidden />
          {state === "loading"
            ? "Loading ad…"
            : REWARDED_AD_UNIT
              ? `Watch a short ad to unlock ${UNLOCK_MINUTES} min`
              : `Unlock ${UNLOCK_MINUTES} min (free during beta)`}
        </Button>
        {state === "dismissed" ? (
          <p className="text-[11px] text-subtle">Ad closed early, nothing unlocked. Try again?</p>
        ) : null}
      </div>
    </div>
  );
}
