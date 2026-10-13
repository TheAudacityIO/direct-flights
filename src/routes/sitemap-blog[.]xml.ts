import { createFileRoute } from "@tanstack/react-router";
import { buildBlogSitemap } from "@/lib/blog/seo";

/** The blog's own sitemap (robots.txt lists it); public/sitemap.xml stays the dataset's. */
export const Route = createFileRoute("/sitemap-blog.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { readPosts } = await import("@/lib/blog/posts.server");
        return new Response(buildBlogSitemap(readPosts()), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
