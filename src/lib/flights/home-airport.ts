/**
 * Opt-in "remember my airport". Stored only on the visitor's device after
 * they ask for it, removed by Forget; never sent to analytics or ads. Every
 * localStorage key the site uses is listed in STORAGE_KEYS and must appear on
 * the privacy page (privacy.test.ts enforces it).
 */
export const HOME_AIRPORT_KEY = "fdf.homeAirport";

const IATA = /^[A-Z]{3}$/;

export function readHomeAirport(): string | null {
  try {
    const v = window.localStorage.getItem(HOME_AIRPORT_KEY);
    return v && IATA.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function rememberHomeAirport(iata: string): void {
  if (!IATA.test(iata)) return;
  try {
    window.localStorage.setItem(HOME_AIRPORT_KEY, iata);
  } catch {
    /* storage blocked: nothing is remembered */
  }
}

export function forgetHomeAirport(): void {
  try {
    window.localStorage.removeItem(HOME_AIRPORT_KEY);
  } catch {
    /* nothing to forget */
  }
}
