/**
 * Rewarded ad request on top of Google Publisher Tag ("rewarded ads for
 * web"). Resolves once the viewer earned the reward, closed the ad early,
 * or no ad could be shown. Callers grant the unlock on "granted" and on
 * "unavailable": a missing or unfilled ad is our problem, not the viewer's.
 */
import { REWARDED_AD_UNIT } from "./config";

export type RewardOutcome = "granted" | "dismissed" | "unavailable";

const GPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";

type GoogleTag = {
  cmd: Array<() => void>;
  defineOutOfPageSlot: (unit: string, format: unknown) => GptSlot | null;
  enums: { OutOfPageFormat: { REWARDED: unknown } };
  pubads: () => {
    addEventListener: (name: string, cb: (ev: { slot: GptSlot; makeRewardedVisible?: () => void }) => void) => void;
    removeEventListener: (name: string, cb: (ev: { slot: GptSlot }) => void) => void;
    enableSingleRequest: () => void;
  };
  enableServices: () => void;
  display: (slot: GptSlot) => void;
  destroySlots: (slots: GptSlot[]) => void;
};
type GptSlot = { addService: (s: unknown) => GptSlot };

declare global {
  interface Window {
    googletag?: GoogleTag;
  }
}

function loadGpt(): Promise<GoogleTag> {
  return new Promise((resolve, reject) => {
    const existing = window.googletag;
    if (existing && typeof existing.defineOutOfPageSlot === "function") return resolve(existing);
    window.googletag = (window.googletag ?? { cmd: [] }) as GoogleTag;
    const script = document.createElement("script");
    script.src = GPT_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => window.googletag!.cmd.push(() => resolve(window.googletag!));
    script.onerror = () => reject(new Error("gpt.js failed to load"));
    document.head.appendChild(script);
  });
}

export async function requestReward(timeoutMs = 8000): Promise<RewardOutcome> {
  if (!REWARDED_AD_UNIT || typeof window === "undefined") return "unavailable";
  let googletag: GoogleTag;
  try {
    googletag = await loadGpt();
  } catch {
    return "unavailable";
  }

  return new Promise((resolve) => {
    const pubads = googletag.pubads();
    const slot = googletag.defineOutOfPageSlot(
      REWARDED_AD_UNIT,
      googletag.enums.OutOfPageFormat.REWARDED,
    );
    if (!slot) return resolve("unavailable");
    slot.addService(pubads);

    let granted = false;
    let settled = false;
    const finish = (outcome: RewardOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      googletag.destroySlots([slot]);
      resolve(outcome);
    };
    const timer = setTimeout(() => finish("unavailable"), timeoutMs);

    pubads.addEventListener("rewardedSlotReady", (ev) => {
      if (ev.slot !== slot) return;
      clearTimeout(timer);
      ev.makeRewardedVisible?.();
    });
    pubads.addEventListener("rewardedSlotGranted", (ev) => {
      if (ev.slot === slot) granted = true;
    });
    pubads.addEventListener("rewardedSlotClosed", (ev) => {
      if (ev.slot === slot) finish(granted ? "granted" : "dismissed");
    });
    pubads.addEventListener("slotRenderEnded", (ev) => {
      const e = ev as unknown as { slot: GptSlot; isEmpty?: boolean };
      if (e.slot === slot && e.isEmpty) finish("unavailable");
    });

    googletag.enableServices();
    googletag.display(slot);
  });
}
