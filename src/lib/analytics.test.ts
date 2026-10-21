import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isBotSuspect } from "./analytics.ts";

const ua = (major: number) =>
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;

describe("isBotSuspect", () => {
  it("flags the stale Chrome builds seen in the 2026-10 bursts", () => {
    assert.equal(isBotSuspect(ua(120), false), true);
  });
  it("keeps current Chrome and non-Chrome browsers", () => {
    assert.equal(isBotSuspect(ua(155), false), false);
    assert.equal(isBotSuspect(ua(140), false), false);
    assert.equal(
      isBotSuspect("Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1", false),
      false,
    );
  });
  it("flags any browser driven by automation", () => {
    assert.equal(isBotSuspect(ua(155), true), true);
  });
});
