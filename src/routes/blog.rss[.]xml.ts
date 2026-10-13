import { createFileRoute } from "@tanstack/react-router";
import { buildRss } from "@/lib/blog/seo";

/** RSS 2.0 feed of every post, newest first. */
export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { readPosts } = await import("@/lib/blog/posts.server");
        return new Response(buildRss(readPosts()), {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
