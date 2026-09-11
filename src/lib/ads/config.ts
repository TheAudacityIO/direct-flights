/**
 * Ad wiring. The AdSense script loads on every page once ADS_ENABLED (the
 * site review needs it present); manual slots render only when their unit
 * id is configured, otherwise the reserved space shows a quiet placeholder
 * so layout never shifts when units arrive. Consent for EEA/UK/CH visitors
 * is Google's certified CMP, enabled in the AdSense console (Privacy &
 * messaging) and delivered through the same script.
 */
export const ADSENSE_CLIENT = "ca-pub-1142224973470587";

export const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED !== "false";

/** AdSense display unit ids (numeric `data-ad-slot`), created after approval. */
export const AD_SLOTS = {
  airportPage: import.meta.env.VITE_ADSENSE_SLOT_AIRPORT ?? "",
  countryPage: import.meta.env.VITE_ADSENSE_SLOT_COUNTRY ?? "",
  mapSidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR ?? "",
} as const;

/** Google Ad Manager rewarded unit path, e.g. `/1234567/fdf-rewarded`. Empty = no rewarded ads yet. */
export const REWARDED_AD_UNIT = import.meta.env.VITE_REWARDED_AD_UNIT ?? "";

/** How long one rewarded view unlocks booking details for, in minutes. */
export const UNLOCK_MINUTES = 30;
