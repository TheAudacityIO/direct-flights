import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getBlogIndex } from "@/lib/blog/pages";
import { groupByCategory } from "@/lib/blog/posts";
import { BLOG_DESCRIPTION, BLOG_TITLE, blogCrumbs, blogJsonLd } from "@/lib/blog/seo";
import { breadcrumbJsonLd, jsonLdScript, pageMeta, SITE_ORIGIN } from "@/lib/flights/seo";

export const Route = createFileRoute("/blog/")({
  loader: () => getBlogIndex(),
  head: ({ loaderData }) => ({
    meta: pageMeta(`${BLOG_TITLE} · FlyDirectFrom`, BLOG_DESCRIPTION, "/blog"),
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/blog` }],
    scripts: [
      jsonLdScript(breadcrumbJsonLd(blogCrumbs())),
      jsonLdScript(blogJsonLd(loaderData ?? [])),
    ],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const posts = Route.useLoaderData();
  const groups = groupByCategory(posts);
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        <Link to="/" className="hover:text-fg">
          FlyDirectFrom
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">{BLOG_TITLE}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Where you can fly nonstop, the airports behind those routes, and how to plan a trip around
        a direct flight.
      </p>

      {groups.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No posts yet.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map((g) => (
            <section key={g.category}>
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-subtle">{g.category}</h2>
              <ul className="mt-3 space-y-5">
                {g.posts.map((p) => (
                  <li key={p.slug}>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: p.slug }}
                      className="text-base font-medium text-fg hover:underline underline-offset-2"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
                    <p className="mt-1 text-xs text-subtle">
                      <time dateTime={p.date}>{p.date}</time> · {p.minutes} min read
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
