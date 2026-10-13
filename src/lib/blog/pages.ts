/**
 * Server functions behind the blog pages. Handlers import the post reader
 * dynamically so post bodies never enter the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { relatedPosts, type Post, type PostSummary } from "./posts.ts";

const summary = ({ html: _html, ...rest }: Post): PostSummary => rest;

export const getBlogIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<PostSummary[]> => {
    const { readPosts } = await import("./posts.server.ts");
    return readPosts().map(summary);
  },
);

export type BlogPostPage = {
  post: Post;
  related: PostSummary[];
  /** The post's airports that have a /from page, with a display name. */
  airports: { iata: string; name: string }[];
};

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<BlogPostPage | null> => {
    const { readPosts } = await import("./posts.server.ts");
    const posts = readPosts();
    const post = posts.find((p) => p.slug === slug);
    if (!post) return null;
    const { readAirports } = await import("../flights/dataset.server.ts");
    const byIata = new Map((await readAirports()).map((a) => [a.iata, a]));
    const airports = post.airports.flatMap((iata) => {
      const ap = byIata.get(iata);
      return ap && ap.destinations > 0 ? [{ iata, name: ap.city || ap.name }] : [];
    });
    return { post, related: relatedPosts(post, posts.map(summary)), airports };
  });

/** Posts that mention an airport, for the "From the blog" links on /from/{IATA}. */
export const getAirportPosts = createServerFn({ method: "GET" })
  .inputValidator((iata: string) => iata.toUpperCase())
  .handler(async ({ data: iata }): Promise<PostSummary[]> => {
    const { readPosts } = await import("./posts.server.ts");
    return readPosts()
      .filter((p) => p.airports.includes(iata))
      .map(summary);
  });
