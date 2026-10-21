/**
 * Rebuild public/sitemap.xml from the committed dataset (public/data) and the
 * Search Console keep list, without the raw OpenFlights dumps. Uses the same
 * datasetSitemapEntries as scripts/build-openflights.ts.
 *
 * Usage:
 *   npm run sitemap:build
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSitemap, datasetSitemapEntries } from "../src/lib/flights/seo.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const readJson = async (rel: string) => JSON.parse(await readFile(path.join(ROOT, rel), "utf8"));

const [airports, meta, keep] = await Promise.all([
  readJson("public/data/airports.json"),
  readJson("public/data/meta.json"),
  readJson("data/search/keep-pages.json"),
]);
const pages = datasetSitemapEntries(airports, meta, keep);
await writeFile(path.join(ROOT, "public/sitemap.xml"), buildSitemap(pages));
console.log(JSON.stringify({ sitemapPages: pages.length }));
