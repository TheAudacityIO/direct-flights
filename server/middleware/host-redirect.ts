/**
 * Canonical-host 301s. flydirectfrom.com is the canonical origin;
 * www and the legacy hostname redirect with path + query preserved.
 * Loopback/health traffic (the compose healthcheck and the deploy
 * verification curl 127.0.0.1) must never be redirected, so only
 * explicitly listed hostnames are.
 */
const CANONICAL_ORIGIN = "https://flydirectfrom.com";
const REDIRECT_HOSTS = new Set(["www.flydirectfrom.com", "flights.miketineo.com"]);

interface HostRedirectEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

function requestHost(event: HostRedirectEvent): string {
  return (
    event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host") ?? event.url.host
  );
}

export default async function hostRedirectMiddleware(
  event: HostRedirectEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const method = (event.req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return next();

  const host = requestHost(event).toLowerCase().split(":")[0];
  if (!REDIRECT_HOSTS.has(host)) return next();

  const location = CANONICAL_ORIGIN + event.url.pathname + event.url.search;
  return new Response(null, {
    status: 301,
    headers: { Location: location, "Cache-Control": "public, max-age=3600" },
  });
}
