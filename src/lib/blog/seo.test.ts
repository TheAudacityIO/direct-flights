import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blogPostingJsonLd, buildBlogSitemap, buildRss, xmlEscape } from "./seo.ts";

const posts = [
  {
    slug: "rome-hubs",
    title: "Rome & its <two> hubs",
    description: `FCO vs "CIA"`,
    date: "2026-10-12",
    updated: "2026-10-13",
    category: "Airports",
  },
  {
    slug: "cagliari",
    title: "Cagliari",
    description: "Nonstops from CAG.",
    date: "2026-10-01",
    updated: "2026-10-01",
    category: "Routes",
  },
];

describe("xmlEscape", () => {
  it("escapes the five XML specials", () => {
    assert.equal(xmlEscape(`<a & "b" 'c'>`), "&lt;a &amp; &quot;b&quot; &apos;c&apos;&gt;");
  });
});

describe("buildRss", () => {
  const rss = buildRss(posts);

  it("is RSS 2.0 with escaped items in the given order", () => {
    assert.match(rss, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    assert.match(rss, /<title>Rome &amp; its &lt;two&gt; hubs<\/title>/);
    assert.match(rss, /<description>FCO vs &quot;CIA&quot;<\/description>/);
    assert.ok(rss.indexOf("rome-hubs") < rss.indexOf("/blog/cagliari"));
    assert.match(rss, /<guid isPermaLink="true">https:\/\/flydirectfrom\.com\/blog\/cagliari<\/guid>/);
  });

  it("dates items and the channel from the posts", () => {
    assert.match(rss, /<pubDate>Mon, 12 Oct 2026 00:00:00 GMT<\/pubDate>/);
    assert.match(rss, /<lastBuildDate>Mon, 12 Oct 2026 00:00:00 GMT<\/lastBuildDate>/);
  });

  it("is still valid with no posts", () => {
    assert.match(buildRss([]), /<channel>[\s\S]*<\/channel>/);
  });
});

describe("buildBlogSitemap", () => {
  it("lists the index with the newest revision and each post with its own", () => {
    const xml = buildBlogSitemap(posts);
    assert.match(xml, /<loc>https:\/\/flydirectfrom\.com\/blog<\/loc><lastmod>2026-10-13<\/lastmod>/);
    assert.match(xml, /<loc>https:\/\/flydirectfrom\.com\/blog\/rome-hubs<\/loc><lastmod>2026-10-13<\/lastmod>/);
    assert.match(xml, /<loc>https:\/\/flydirectfrom\.com\/blog\/cagliari<\/loc><lastmod>2026-10-01<\/lastmod>/);
  });
});

describe("blogPostingJsonLd", () => {
  it("carries dates, url and The Audacity as author and publisher", () => {
    const ld = blogPostingJsonLd(posts[0]);
    assert.equal(ld["@type"], "BlogPosting");
    assert.equal(ld.datePublished, "2026-10-12");
    assert.equal(ld.dateModified, "2026-10-13");
    assert.equal(ld.url, "https://flydirectfrom.com/blog/rome-hubs");
    assert.deepEqual((ld.author as { name: string }).name, "The Audacity");
  });
});
