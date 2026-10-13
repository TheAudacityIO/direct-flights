/**
 * Every post under content/blog, parsed and rendered once per server process.
 * The markdown is inlined into the server bundle by Vite's glob (no fs paths
 * at runtime); only server functions and server routes import this module, so
 * post bodies never reach the client bundle.
 */
import { renderMarkdown } from "./markdown.ts";
import { parsePost, sortPosts, type Post } from "./posts.ts";

const files = import.meta.glob<string>("/content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function load(): Post[] {
  const posts: Post[] = [];
  for (const [file, raw] of Object.entries(files)) {
    const slug = file.slice(file.lastIndexOf("/") + 1, -".md".length);
    if (slug === "README") continue;
    try {
      const { summary, body } = parsePost(slug, raw);
      posts.push({ ...summary, html: renderMarkdown(body) });
    } catch (err) {
      // One broken post must not take the whole blog down; it just stays unpublished.
      console.error(err);
    }
  }
  return sortPosts(posts);
}

let cache: Post[] | null = null;

/** Newest first. */
export function readPosts(): Post[] {
  cache ??= load();
  return cache;
}
