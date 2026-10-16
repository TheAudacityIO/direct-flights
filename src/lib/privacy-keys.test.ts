import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";

// Every browser-storage key the site writes ("fdf.*") must be named on the privacy page.
const SRC = new URL("../", import.meta.url);

function files(dir: URL): URL[] {
  return readdirSync(dir).flatMap((name) => {
    const url = new URL(name, dir);
    if (statSync(url).isDirectory()) return files(new URL(`${name}/`, dir));
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [url] : [];
  });
}

describe("privacy page", () => {
  it("names every fdf.* storage key", () => {
    const privacy = readFileSync(new URL("routes/privacy.tsx", SRC), "utf8");
    const keys = new Set(
      files(SRC).flatMap((f) => [...readFileSync(f, "utf8").matchAll(/["'](fdf\.[A-Za-z.]+)["']/g)].map((m) => m[1])),
    );
    assert.ok(keys.size >= 2, `expected the unlock and home-airport keys, found ${[...keys]}`);
    for (const key of keys) assert.ok(privacy.includes(key), `${key} missing from src/routes/privacy.tsx`);
  });
});
