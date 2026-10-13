import { useEffect, useRef } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AdSlot } from "@/components/ads/AdSlot";
import { PlanTrip } from "@/components/ads/PlanTrip";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AD_SLOTS } from "@/lib/ads/config";
import { track } from "@/lib/analytics";
import { getBlogPost } from "@/lib/blog/pages";
import { blogCrumbs, blogPostingJsonLd, blogPostPath } from "@/lib/blog/seo";
import { breadcrumbJsonLd, jsonLdScript, pageMeta, SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const page = await getBlogPost({ data: params.slug });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Post not found · FlyDirectFrom" }] };
    const { post } = loaderData;
    return {
      meta: [
        ...pageMeta(`${post.title} · FlyDirectFrom`, post.description, blogPostPath(post.slug)),
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: post.date },
        { property: "article:modified_time", content: post.updated },
        { property: "article:section", content: post.category },
      ],
      links: [{ rel: "canonical", href: SITE_ORIGIN + blogPostPath(post.slug) }],
      scripts: [
        jsonLdScript(breadcrumbJsonLd(blogCrumbs(post))),
        jsonLdScript(blogPostingJsonLd(post)),
      ],
    };
  },
  notFoundComponent: NotFoundPage,
  component: BlogPostPage,
});

const link = "underline underline-offset-2 hover:text-fg";

function NotFoundPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">FlyDirectFrom</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">Post not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        No post lives at this address.{" "}
        <Link to="/blog" className={link}>
          Read the blog
        </Link>{" "}
        or{" "}
        <Link to="/" className={link}>
          search the map
        </Link>
        .
      </p>
      <SiteFooter />
    </main>
  );
}

/** Fires article_read once, when the reader scrolls past 75% of the article. */
function useReadTracking(slug: string, category: string) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const e = entries[0];
      // Visible now, or already scrolled above the viewport (fast scroll or a jump link).
      if (e && (e.isIntersecting || e.boundingClientRect.top < 0)) {
        track("article_read", { slug, category });
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [slug, category]);
  return sentinel;
}

function BlogPostPage() {
  const { post, related, airports } = Route.useLoaderData();
  const sentinel = useReadTracking(post.slug, post.category);
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
        {" / "}
        <Link to="/blog" className="hover:text-fg">
          Blog
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg text-balance">{post.title}</h1>
      <p className="mt-2 text-xs text-subtle">
        <time dateTime={post.date}>{post.date}</time> · {post.category} · {post.minutes} min read
      </p>

      <div className="relative mt-8">
        <article className="article" dangerouslySetInnerHTML={{ __html: post.html }} />
        <div ref={sentinel} aria-hidden className="pointer-events-none absolute inset-x-0 top-3/4 h-px" />
      </div>

      <AdSlot slot={AD_SLOTS.article} className="mt-10" />

      {airports.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-fg">Airports in this post</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {airports.map((ap) => (
              <li key={ap.iata}>
                <Link
                  to="/from/$iata"
                  params={{ iata: ap.iata }}
                  className="text-muted hover:text-fg hover:underline underline-offset-2"
                >
                  Direct flights from {ap.name} <span className="font-mono text-accent">{ap.iata}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {post.partners.length > 0 ? (
        <div className="mt-10">
          <PlanTrip partners={post.partners} destination={post.destination || undefined} placement="blog_post" />
        </div>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-fg">Keep reading</h2>
          <ul className="mt-3 space-y-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="text-sm font-medium text-fg hover:underline underline-offset-2"
                >
                  {p.title}
                </Link>
                <p className="mt-0.5 text-xs text-subtle">
                  {p.category} · {p.minutes} min read
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
