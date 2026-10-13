import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupByCategory, parseFrontmatter, parsePost, readingMinutes, relatedPosts, sortPosts } from "./posts.ts";
import { renderMarkdown } from "./markdown.ts";

const RAW = `---
title: Where can you fly direct from Cagliari?
description: "Every nonstop from CAG, with airlines."
date: 2026-10-13
category: Routes
airports: CAG, olb, AHO, nope
destination: Sardinia
partners: flights, hotels, bogus, esim
---

Body text here.
`;

describe("parseFrontmatter", () => {
  it("splits key: value lines from the body and drops wrapping quotes", () => {
    const { data, body } = parseFrontmatter(RAW);
    assert.equal(data.title, "Where can you fly direct from Cagliari?");
    assert.equal(data.description, "Every nonstop from CAG, with airlines.");
    assert.equal(data.date, "2026-10-13");
    assert.equal(body.trim(), "Body text here.");
  });

  it("keeps colons inside values and handles CRLF", () => {
    const { data } = parseFrontmatter("---\r\ntitle: Rome: the hubs\r\n---\r\nx");
    assert.equal(data.title, "Rome: the hubs");
  });

  it("returns the whole text as body without frontmatter", () => {
    assert.deepEqual(parseFrontmatter("# hi"), { data: {}, body: "# hi" });
  });
});

describe("parsePost", () => {
  it("normalises lists and drops unknown airports and partners", () => {
    const { summary } = parsePost("cagliari", RAW);
    assert.deepEqual(summary.airports, ["CAG", "OLB", "AHO"]);
    assert.deepEqual(summary.partners, ["flights", "hotels", "esim"]);
    assert.equal(summary.destination, "Sardinia");
    assert.equal(summary.updated, "2026-10-13");
    assert.equal(summary.minutes, 1);
  });

  it("throws on a missing title or a malformed date", () => {
    assert.throws(() => parsePost("x", "---\ndescription: d\ndate: 2026-10-13\n---\n"), /title/);
    assert.throws(() => parsePost("x", "---\ntitle: t\ndescription: d\ndate: 13/10/2026\n---\n"), /YYYY-MM-DD/);
  });
});

describe("readingMinutes", () => {
  it("rounds words / 230 up, at least one minute", () => {
    assert.equal(readingMinutes(""), 1);
    assert.equal(readingMinutes(Array(231).fill("w").join(" ")), 2);
  });
});

const post = (slug: string, category: string, date: string) => ({
  slug,
  title: slug,
  description: "",
  date,
  updated: date,
  category,
  airports: [],
  destination: "",
  partners: [],
  minutes: 1,
});

describe("ordering", () => {
  const all = [
    post("a", "Routes", "2026-10-01"),
    post("b", "Aerospace", "2026-10-09"),
    post("c", "Routes", "2026-10-05"),
    post("d", "Routes", "2026-10-03"),
    post("e", "Airports", "2026-10-10"),
  ];

  it("sorts newest first", () => {
    assert.deepEqual(sortPosts(all).map((p) => p.slug), ["e", "b", "c", "d", "a"]);
  });

  it("picks related posts from the same category first", () => {
    assert.deepEqual(relatedPosts(all[0], all).map((p) => p.slug), ["c", "d", "e"]);
  });

  it("groups in the fixed category order", () => {
    assert.deepEqual(groupByCategory(all).map((g) => g.category), ["Routes", "Airports", "Aerospace"]);
  });
});

describe("renderMarkdown", () => {
  it("opens external links in a new tab and leaves internal ones alone", () => {
    const html = renderMarkdown("[ext](https://example.com/a?b=1&c=2) and [int](/from/CAG)");
    assert.match(html, /<a href="https:\/\/example\.com\/a\?b=1&amp;c=2" target="_blank" rel="noopener">ext<\/a>/);
    assert.match(html, /<a href="\/from\/CAG">int<\/a>/);
  });

  it("escapes raw HTML and drops unsafe link schemes", () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\nx <b>y</b> [bad](javascript:alert(1))');
    assert.doesNotMatch(html, /<script|<b>|javascript:/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /bad/);
  });
});

// The server skips a broken post at runtime instead of failing; this makes CI fail first.
describe("content/blog", () => {
  it("every post parses and renders", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const dir = new URL("../../../content/blog/", import.meta.url);
    const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md");
    assert.ok(files.length > 0);
    for (const f of files) {
      const { body } = parsePost(f.slice(0, -3), readFileSync(new URL(f, dir), "utf8"));
      assert.ok(renderMarkdown(body).length > 0, f);
    }
  });
});
