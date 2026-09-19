# Blocked: decisions and gates that need Miguel

Written 2026-09-18. Each item names the decision, the options, and where to look.

## B1. Merge and deploy the overnight branch (RESOLVED 2026-09-19: Miguel removed human gates for this exercise; the branch is merged on green CI by the agent)

Decision: whether `overnight/seo-monetisation` goes to `main`. It was committed locally on atlas
and NOT pushed: `TheAudacityIO/direct-flights` is not on the auto-commit allowlist in
`~/.claude/CLAUDE.md`.

- Option A: review the diff and push the branch, open a PR, let CI (now including lint) gate it.
  `git -C ~/hack/miketineo/the-audacity/projects/direct-flights-overnight push -u origin overnight/seo-monetisation`
- Option B: cherry-pick only the JSON-LD commit if the workflow/Dockerfile edits should wait.

Note: the push touches `.github/workflows/*`, which needs the `workflow` scope on the `gh` token
(memory says the atlas token has had it since 2026-09-15; the Mac is the fallback).

Files: everything in `git diff origin/main..overnight/seo-monetisation`.

## B2. Google Search Console verification (PLANE.md Now #2)

Decision: verify `flydirectfrom.com` in Search Console. Needs Miguel's Google account.

- Option A (scriptable after the token exists): DNS TXT record on the personal Cloudflare zone.
  Miguel copies the `google-site-verification=…` value from Search Console; adding the record is a
  one-liner with the personal Cloudflare credentials (`cloud-ops` skill).
- Option B: HTML file method, needs a code push per token; not worth it.

Then submit the sitemap and request indexing for `/`, `/from`, `/from/FCO`.

## B3. AdSense site review and go-live (RESOLVED 2026-09-19 on Miguel's side; review pending at Google; whether a GDPR message is published is NOT verifiable from outside, check Privacy & messaging in the console)

Decision: none new, but every step is a console action under Miguel's account:

1. AdSense → Sites → flydirectfrom.com → Verify (ads.txt has been live since 2026-09-11), then
   Request review.
2. After approval: Auto ads ON (Anchor + In-page, Vignette off initially).
3. Create 3 display units → set repo variables `ADSENSE_SLOT_AIRPORT / _COUNTRY / _SIDEBAR` →
   redeploy (`docs/overnight/monetisation.md` § 3 has the commands).
4. Privacy & messaging → GDPR message published (§ 2 of the same doc).
5. Seller information visibility → Transparent, business name "The Audacity".

Spend impact: none (AdSense is revenue, not cost). Compliance impact: personalised ads must not
serve in the EEA before step 4 is published. Google enforces this on its side once the message
exists; before that, AdSense serves limited ads by default in the EEA under its 2024 policy, but the
site's privacy page promises a consent dialog, so publish the message before requesting review
finishes if possible.

## B4. Rewarded ads unit (PLANE.md Next)

Decision: open a Google Ad Manager account and create a "rewarded ads for web" unit, or keep the
free unlock. Needs Miguel's account. When it exists: `gh variable set REWARDED_AD_UNIT --body
"/<network>/fdf-rewarded"` and redeploy; the build arg is already wired.

## B5. Trailing-slash redirect status (observation, low priority)

`/from/FCO/` answers 307 (temporary) rather than 301. Google treats 307 as temporary and may keep
re-crawling both forms. The sitemap only lists slash-less URLs and canonicals are correct, so the
impact is small. Fixing it means either a TanStack router `trailingSlash: "never"` option (check that
version 1.170 emits 301 for it) or a Nitro middleware next to the host-redirect one. Not done
overnight because it touches routing for every page.

## B6. Payload on the map page (PLANE.md Now #5d)

`/` still ships the full airports index and MapLibre on first load. Reducing it is a measured
performance project (lazy-load the index behind the search box, or split by continent), not an
overnight change. Blocked on wanting real Core Web Vitals data from Search Console first.
