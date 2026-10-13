/** Blog feeds and structured data (pure, testable). */
import { SITE_ORIGIN, type Crumb } from "../flights/seo.ts";
import type { PostSummary } from "./posts.ts";

export const BLOG_TITLE = "FlyDirectFrom blog";
export const BLOG_DESCRIPTION =
  "Nonstop routes, airports and trip planning from the team behind FlyDirectFrom, the free direct-flight map.";

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`;
}

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 date for RSS, at midnight UTC of the post's day. */
const rssDate = (day: string) => new Date(`${day}T00:00:00Z`).toUTCString();

type FeedPost = Pick<PostSummary, "slug" | "title" | "description" | "date" | "updated" | "category">;

/** RSS 2.0 for /blog/rss.xml; `posts` newest first. lastBuildDate is the newest post, so the feed only changes when a post does. */
export function buildRss(posts: FeedPost[]): string {
  const items = posts
    .map((p) => {
      const url = SITE_ORIGIN + blogPostPath(p.slug);
      return [
        "    <item>",
        `      <title>${xmlEscape(p.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <description>${xmlEscape(p.description)}</description>`,
        `      <category>${xmlEscape(p.category)}</category>`,
        `      <pubDate>${rssDate(p.date)}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  const newest = posts[0];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(BLOG_TITLE)}</title>`,
    `    <link>${SITE_ORIGIN}/blog</link>`,
    `    <description>${xmlEscape(BLOG_DESCRIPTION)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${SITE_ORIGIN}/blog/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...(newest ? [`    <lastBuildDate>${rssDate(newest.date)}</lastBuildDate>`] : []),
    ...(items ? [items] : []),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/** /sitemap-blog.xml: the index (lastmod = newest post) and every post (lastmod = its revision day). */
export function buildBlogSitemap(posts: FeedPost[]): string {
  const newest = posts.reduce((max, p) => (p.updated > max ? p.updated : max), "");
  const rows = [
    { path: "/blog", lastmod: newest },
    ...posts.map((p) => ({ path: blogPostPath(p.slug), lastmod: p.updated })),
  ].map(
    (r) =>
      `  <url><loc>${xmlEscape(SITE_ORIGIN + r.path)}</loc>${
        r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ""
      }</url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

const PUBLISHER = { "@type": "Organization", name: "The Audacity", url: "https://theaudacity.io" };

export function blogCrumbs(post?: Pick<PostSummary, "slug" | "title">): Crumb[] {
  return [
    { name: "FlyDirectFrom", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(post ? [{ name: post.title, path: blogPostPath(post.slug) }] : []),
  ];
}

export function blogPostingJsonLd(
  post: Pick<PostSummary, "slug" | "title" | "description" | "date" | "updated">,
): Record<string, unknown> {
  const url = SITE_ORIGIN + blogPostPath(post.slug);
  return {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: PUBLISHER,
    publisher: PUBLISHER,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    isPartOf: { "@id": `${SITE_ORIGIN}/blog#blog` },
  };
}

export function blogJsonLd(posts: Pick<PostSummary, "slug" | "title" | "date">[]): Record<string, unknown> {
  return {
    "@type": "Blog",
    "@id": `${SITE_ORIGIN}/blog#blog`,
    url: `${SITE_ORIGIN}/blog`,
    name: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    publisher: PUBLISHER,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.date,
      url: SITE_ORIGIN + blogPostPath(p.slug),
    })),
  };
}
