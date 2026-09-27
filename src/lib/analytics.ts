/**
 * Cookieless PostHog. Memory persistence (no cookies, no localStorage), no
 * autocapture, no session replay: pageviews, referrers and the booking-click
 * event are all we need to see where visitors come from and whether they go
 * on to a fare search. Events go through the shared z.miketineo.com proxy into
 * The Audacity project, tagged product=flydirectfrom. The trade-off of memory
 * persistence: a full page reload counts as a new visitor.
 */
import type { PostHog } from "posthog-js";

const POSTHOG_KEY = "phc_CefEYSP2v97ZazvvsctE6r8iKtej6qdubPyyaM8UR7Vs";

let client: PostHog | null = null;
let started = false;

export function initAnalytics() {
  // Production host only: dev servers, previews and tests send nothing.
  if (started || typeof window === "undefined") return;
  if (!/(^|\.)flydirectfrom\.com$/.test(window.location.hostname)) return;
  started = true;
  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: "https://z.miketineo.com",
      ui_host: "https://eu.posthog.com",
      persistence: "memory",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: true,
      // The Audacity project turns these on remotely for its other sites;
      // this site collects only what the privacy page lists.
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      capture_performance: false,
      loaded: (ph) => ph.register({ product: "flydirectfrom" }),
    });
    client = posthog;
  });
}

export function track(event: string, properties?: Record<string, unknown>) {
  client?.capture(event, properties);
}
