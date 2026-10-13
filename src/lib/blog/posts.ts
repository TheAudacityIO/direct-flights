/** Blog post parsing (no fs, no Vite APIs, testable). Format: content/blog/README.md. */
import { isPartner, type Partner } from "../affiliates.ts";

export type PostSummary = {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD; the publish date when the post was never revised. */
  updated: string;
  category: string;
  airports: string[];
  destination: string;
  partners: Partner[];
  minutes: number;
};

export type Post = PostSummary & { html: string };

/** Display order on /blog; unknown categories follow, alphabetically. */
export const CATEGORIES = ["Routes", "Airports", "Travel guides", "Aerospace"];

/** `---` fenced `key: value` lines, then the markdown body. Quotes around a value are dropped. */
export function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  // Drop a byte-order mark (U+FEFF) some editors prepend.
  const text = (raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).replace(/\r\n?/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const value = line
      .slice(i + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
    if (key) data[key] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 230));
}

/** Frontmatter + body to a summary; throws on a missing title/description/date so a broken post is loud. */
export function parsePost(slug: string, raw: string): { summary: PostSummary; body: string } {
  const { data, body } = parseFrontmatter(raw);
  for (const key of ["title", "description", "date"]) {
    if (!data[key]) throw new Error(`content/blog/${slug}.md: missing "${key}"`);
  }
  if (!DAY.test(data.date)) throw new Error(`content/blog/${slug}.md: date must be YYYY-MM-DD`);
  const updated = data.updated && DAY.test(data.updated) ? data.updated : data.date;
  return {
    summary: {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      updated,
      category: data.category || "Travel guides",
      airports: list(data.airports)
        .map((c) => c.toUpperCase())
        .filter((c) => /^[A-Z]{3}$/.test(c)),
      destination: data.destination ?? "",
      partners: list(data.partners).filter(isPartner),
      minutes: readingMinutes(body),
    },
    body,
  };
}

/** Newest first; ties by title so the order is stable. */
export function sortPosts<T extends Pick<PostSummary, "date" | "title">>(posts: T[]): T[] {
  return posts.slice().sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/** Up to `limit` other posts, same category first, each group newest first. */
export function relatedPosts(post: PostSummary, all: PostSummary[], limit = 3): PostSummary[] {
  const others = sortPosts(all.filter((p) => p.slug !== post.slug));
  return [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, limit);
}

/** Posts grouped by category in CATEGORIES order. */
export function groupByCategory(posts: PostSummary[]): { category: string; posts: PostSummary[] }[] {
  const names = [...new Set(posts.map((p) => p.category))].sort((a, b) => {
    const ia = CATEGORIES.indexOf(a);
    const ib = CATEGORIES.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    return a.localeCompare(b);
  });
  return names.map((category) => ({
    category,
    posts: sortPosts(posts.filter((p) => p.category === category)),
  }));
}
