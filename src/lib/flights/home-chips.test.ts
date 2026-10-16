import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chipsForTimezone, GLOBAL_CHIPS } from "./home-chips.ts";

describe("chipsForTimezone", () => {
  it("uses the exact zone first", () => {
    assert.deepEqual(chipsForTimezone("Europe/London"), { codes: ["LHR", "MAN", "EDI", "LGW"], local: true });
    assert.equal(chipsForTimezone("America/New_York").codes[0], "JFK");
  });
  it("falls back to the region, then the global list", () => {
    assert.equal(chipsForTimezone("Europe/Lisbon").codes[0], "LHR");
    assert.deepEqual(chipsForTimezone("Etc/UTC"), { codes: GLOBAL_CHIPS, local: false });
    assert.deepEqual(chipsForTimezone(undefined), { codes: GLOBAL_CHIPS, local: false });
  });
  it("never defaults to a single home city", () => {
    assert.ok(!GLOBAL_CHIPS.includes("CAG"));
  });
});
