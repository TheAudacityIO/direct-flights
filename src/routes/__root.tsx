import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { ADS_ENABLED, ADSENSE_CLIENT } from "@/lib/ads/config";

const APP_NAME = "FlyDirectFrom";
const APP_DESC =
  "Where can you fly direct? Search any airport and see every nonstop destination on a fast, free map. No clutter.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: APP_DESC },
      { name: "theme-color", content: "#08090c" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://flydirectfrom.com/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
      { rel: "preconnect", href: "https://tiles.openfreemap.org" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
    scripts: ADS_ENABLED
      ? [
          {
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
            async: true,
            crossOrigin: "anonymous",
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">FlyDirectFrom</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-fg">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Nothing lives at this address.{" "}
        <Link to="/from" className="underline underline-offset-2 hover:text-fg">
          Browse airports by country
        </Link>{" "}
        or{" "}
        <Link to="/" className="underline underline-offset-2 hover:text-fg">
          search the map
        </Link>
        .
      </p>
      <SiteFooter />
    </main>
  ),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
