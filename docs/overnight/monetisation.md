# Monetisation readiness: consent, AdSense, placements

Written 2026-09-18 on branch `overnight/seo-monetisation`. Everything below describes code that is
already on `main` (886f792) plus the build-arg wiring added on this branch. Nothing here needs new
client code; the remaining steps are console actions listed in `blocked.md`.

## 1. Where the site stands

| Piece | State | Where |
|---|---|---|
| ads.txt | live, real publisher id `pub-1142224973470587` | `public/ads.txt` |
| AdSense loader | on every page, async, crossorigin | `src/routes/__root.tsx` (`ADS_ENABLED`) |
| Display placements | 3 reserved spaces, labelled, height reserved | `src/components/ads/AdSlot.tsx` |
| Unit ids | empty until the units exist; now build args | `src/lib/ads/config.ts`, `Dockerfile`, `deploy.yml` |
| Consent (EEA/UK/CH) | Google's certified CMP, enabled in the console | delivered by `adsbygoogle.js`; revocation via footer |
| Privacy policy | live, names The Audacity as controller | `src/routes/privacy.tsx` |
| Rewarded unlock | free-unlock until an Ad Manager unit exists | `src/components/ads/RewardGate.tsx`, `src/lib/ads/rewarded.ts` |

## 2. CMP integration plan

Decision already on record (PLANNING.md open decisions, leaning "Funding Choices"): use Google's
own consent management platform, which is TCF 2.2 certified and IAB-registered. It is the right fit
here because:

- It needs no extra script. `adsbygoogle.js` loads the GDPR message once "Privacy & messaging" is
  published for the site in the AdSense console. Adding a second CMP script would double-prompt.
- It signals consent to AdSense itself, so no Consent Mode v2 `gtag('consent', 'default', …)`
  snippet is required. That snippet matters when Google Analytics or Google Ads tags run on the page;
  `main` has neither.
- Revocation is already wired: the footer "Ad choices" button calls
  `googlefc.showRevocationMessage()` (`src/components/site/SiteFooter.tsx`). Google's policy
  requires a persistent way to withdraw consent; this is it.

What Google shows an EEA visitor before any personalised ad request: the consent dialog with
"Consent", "Manage options" and, if enabled, "Do not consent". With non-consent, AdSense serves
limited (non-personalised) ads only.

Console steps (Miguel, AdSense → Privacy & messaging):

1. GDPR message → Create → select site flydirectfrom.com → language English (add others later).
2. Choose "Consent / Manage options / Do not consent" (three-button, the safest reading of the
   EDPB guidance) and set the ad partners list to Google's commonly used partners.
3. Publish. The message goes live within about an hour without a redeploy.
4. Optional: "US state regulations" message for CCPA and the Swiss/UK toggles under the same panel.

Verification after publishing (from an EU IP, in a fresh private window):

```
curl -s https://flydirectfrom.com/ | grep -c 'adsbygoogle.js'        # 1 (already true)
# In the browser: open the site from an EU IP, the Google consent dialog must appear
# before any request to googleads.g.doubleclick.net shows in the network tab.
```

If Miguel later prefers an independent CMP (Cookiebot, Usercentrics, iubenda are on Google's
certified list), the change is one `scripts` entry in `src/routes/__root.tsx` placed BEFORE the
AdSense loader, plus the footer button calling that vendor's "renew consent" API instead of
`googlefc`. The privacy page text describing "a consent dialog from Google" would also change.

## 3. Turning the reserved spaces into live ads

The code renders `<ins class="adsbygoogle">` only when a unit id is non-empty. Unit ids are public
(they appear in the page HTML) so they are GitHub Actions repository variables, not secrets.

After AdSense approval:

1. Ads → By site → flydirectfrom.com → Auto ads: ON, with Anchor and In-page formats enabled and
   Vignette OFF at first (vignettes are between-navigation interstitials; enable only after checking
   the mobile experience).
2. Ads → By ad unit → Display ads → create three responsive units named
   `fdf-airport`, `fdf-country`, `fdf-sidebar`; copy the numeric `data-ad-slot` values.
3. Set the repo variables and redeploy:

```
gh variable set ADSENSE_SLOT_AIRPORT -R TheAudacityIO/direct-flights --body "<numeric id>"
gh variable set ADSENSE_SLOT_COUNTRY -R TheAudacityIO/direct-flights --body "<numeric id>"
gh variable set ADSENSE_SLOT_SIDEBAR -R TheAudacityIO/direct-flights --body "<numeric id>"
gh workflow run deploy.yml -R TheAudacityIO/direct-flights
```

4. Verify:

```
curl -s https://flydirectfrom.com/from/FCO | grep -c 'data-ad-slot='   # expected: 2
curl -s https://flydirectfrom.com/from/FCO | grep -c 'Ad space reserved' # expected: 0
```

## 4. Placement patterns that fit the UX

Already shipped, all below or beside content and never over the map:

| Placement | Page | Position | Reserved height | Why |
|---|---|---|---|---|
| `airportPage` (top) | `/from/{IATA}` | after the "Open on the map" button, before the table | 120 px | first viewport, above the fold on desktop, does not push the h1 |
| `airportPage` (bottom) | `/from/{IATA}` | after "About these routes", before the footer | 250 px | end-of-content, highest intent to leave, no layout shift |
| `countryPage` | `/countries/{slug}` | after the airport table | 250 px | single unit on a list page keeps it scannable |
| `mapSidebar` | `/` (map) | in the sidebar under the destination list, desktop only | 100 px | the map stays untouched; the sidebar scrolls |

Rules encoded in `AdSlot`: an "Advertisement" label (AdSense labelling policy), `min-height`
reserved up front (Core Web Vitals CLS), `data-full-width-responsive` on, no ad inside the sticky
header, no ad in the mobile bottom sheet (touch-adjacent, accidental-click risk).

Not proposed: sticky footers (Auto ads Anchor covers this if wanted), in-table rows between
destinations (breaks the scannable table and reads as native content), anything over the MapLibre
canvas (control obstruction and policy risk).

## 5. Performance guardrails

- `adsbygoogle.js` is `async`; it does not block first paint. The consent dialog is injected by that
  script, so the map page's Largest Contentful Paint is unaffected until the first ad fills.
- Keep the per-page unit count at two or fewer on airport pages. Google's "valuable inventory"
  policy dislikes pages where ads outweigh content; the smallest airport pages have a handful of rows.
- Lighthouse after go-live: compare `/from/FCO` before and after unit ids ship; CLS must stay under
  0.1. If it does not, raise the reserved `minHeight` to match the filled ad height on that slot.

## 6. Search Console (traffic side)

Unchanged from PLANE.md Now #2. Once verified: submit `https://flydirectfrom.com/sitemap.xml`, request
indexing for `/`, `/from`, `/from/FCO`, and check "Enhancements → Breadcrumbs" after a week; the
JSON-LD added on this branch should register there.

Structured data test (no account needed): paste `https://flydirectfrom.com/from/FCO` into
https://validator.schema.org once the branch is on `main`.
