import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAffiliate, isPartner, partnerRel, partnerUrl } from "./affiliates.ts";

describe("partnerUrl", () => {
  it("fills {q} and {origin} in a template, URL-encoded", () => {
    assert.equal(
      partnerUrl("hotels", { destination: "São Paulo & co" }, "https://www.booking.com/searchresults.html?ss={q}&aid=123"),
      "https://www.booking.com/searchresults.html?ss=S%C3%A3o%20Paulo%20%26%20co&aid=123",
    );
    assert.equal(
      partnerUrl("flights", { origin: "CAG", destination: "DUB" }, "https://x.example/r?o={origin}&d={q}"),
      "https://x.example/r?o=CAG&d=DUB",
    );
  });

  it("falls back to the plain URL without a template", () => {
    assert.equal(partnerUrl("hotels", { destination: "Sardinia" }, ""), "https://www.booking.com/searchresults.html?ss=Sardinia");
    assert.equal(partnerUrl("hotels", {}, ""), "https://www.booking.com/");
    assert.equal(partnerUrl("activities", { destination: "Rome" }, ""), "https://www.getyourguide.com/s/?q=Rome");
    assert.equal(partnerUrl("esim", {}, ""), "https://www.airalo.com/");
    assert.equal(partnerUrl("insurance", {}, ""), "https://safetywing.com/");
    assert.equal(partnerUrl("compensation", {}, ""), "https://www.airhelp.com/");
    assert.equal(partnerUrl("flights", { origin: "CAG" }, ""), "https://www.skyscanner.net/transport/flights-from/cag/");
  });

  it("ignores a template that is not https", () => {
    assert.equal(partnerUrl("esim", {}, "javascript:alert(1)"), "https://www.airalo.com/");
    assert.equal(isAffiliate("esim", "http://x.example/"), false);
  });

  it("defaults to the plain URLs when no env is set (node has no import.meta.env)", () => {
    assert.equal(isAffiliate("hotels"), false);
    assert.equal(partnerUrl("compensation", {}), "https://www.airhelp.com/");
  });
});

describe("isAffiliate / partnerRel / isPartner", () => {
  it("marks affiliate links sponsored", () => {
    assert.equal(isAffiliate("hotels", "https://www.booking.com/?aid=1&ss={q}"), true);
    assert.equal(partnerRel(true), "sponsored nofollow noopener");
    assert.equal(partnerRel(false), "nofollow noopener");
  });

  it("knows the six partners", () => {
    assert.equal(isPartner("esim"), true);
    assert.equal(isPartner("cars"), false);
  });
});
