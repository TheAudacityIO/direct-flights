import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const KEY = "fdf-theme";
const EVENT = "fdf-theme";

export const THEME_COLOR: Record<Theme, string> = { dark: "#08090c", light: "#f6f5f1" };

/** Inline in <head>, before first paint, so a light-mode visitor never sees a dark flash. Dark is the default. */
export const THEME_BOOT = `try{if(localStorage.getItem("${KEY}")==="light"){document.documentElement.dataset.theme="light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${THEME_COLOR.light}")}}catch(e){}`;

export function currentTheme(): Theme {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
    ? "light"
    : "dark";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or blocked storage: the switch still applies for this visit.
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => "dark");
}
