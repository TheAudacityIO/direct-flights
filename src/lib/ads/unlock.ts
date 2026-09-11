import { useEffect, useState } from "react";
import { UNLOCK_MINUTES } from "./config";

const KEY = "fdf.unlock.until";
const EVENT = "fdf:unlock";

function readUntil(): number {
  try {
    return Number(localStorage.getItem(KEY) ?? 0);
  } catch {
    return 0;
  }
}

export function isUnlocked(now = Date.now()): boolean {
  return readUntil() > now;
}

export function grantUnlock(minutes = UNLOCK_MINUTES): void {
  try {
    localStorage.setItem(KEY, String(Date.now() + minutes * 60_000));
  } catch {
    /* private mode: the unlock lasts for this render only */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** SSR-safe: renders locked on the server, then reads the timer on the client. */
export function useUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    const sync = () => setUnlocked(isUnlocked());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return unlocked;
}
