#!/usr/bin/env node
/**
 * Submit every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver share
 * submissions). The key is public by design: search engines verify it by
 * fetching /<key>.txt from the site. Run after a deploy that changes pages:
 *   node scripts/indexnow.mjs
 */
import { readFileSync } from "node:fs";

const HOST = "flydirectfrom.com";
const KEY = "cb1510f6df43df6caf94883c03f59150";

const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
});
console.log(`IndexNow: ${urls.length} URLs -> HTTP ${res.status}`);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
