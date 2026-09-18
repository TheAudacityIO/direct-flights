# Success Criteria: direct-flights

Rule: every criterion must be checkable by a command or an observable fact. If you can't write the verification, the criterion isn't ready.

## Definition of done (monetization-ready phase)

- [x] Site live and healthy on atlas via autonomous CI/CD (met 2026-08-22)
      Verify: `curl -s -o /dev/null -w '%{http_code}' https://flydirectfrom.com/` → expected: `200`
- [x] Pipeline green on `main` (tests + typecheck gate before every deploy)
      Verify: `gh run list -R TheAudacityIO/direct-flights -L 1` → expected: latest run `success`
- [x] Per-airport pages crawlable with a served sitemap (met 2026-09-11, verified 2026-09-18: 3162)
      Verify: `curl -s https://flydirectfrom.com/sitemap.xml | grep -c '<loc>'` → expected: > 100
- [x] Privacy policy page live and linked from the site (met 2026-09-11, verified 2026-09-18)
      Verify: `curl -s -o /dev/null -w '%{http_code}' https://flydirectfrom.com/privacy` → expected: `200`
- [ ] AdSense approved and serving (both verify commands pass since 2026-09-12; approval itself is pending in the AdSense console)
      Verify: `curl -s https://flydirectfrom.com/ads.txt | grep google.com` → expected: line with `pub-<id>, DIRECT`
      Verify: `curl -s https://flydirectfrom.com/ | grep -c adsbygoogle` → expected: ≥ 1
- [ ] EEA consent in place before personalized ads
      Verify: homepage HTML includes the chosen Google-certified CMP script; manual check from an EU IP shows the consent dialog before any personalized ad request.
- [ ] First revenue signal
      Verify: manual — AdSense dashboard shows impressions > 0 and non-zero estimated earnings in any 30-day window.

## Quality gates (every change, not just at the end)

- [ ] Tests pass: `npm test`
- [ ] Types pass: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
- [ ] No secrets in diff: check for `.env`, `*_KEY`, `credentials.*`

## Explicitly NOT required

- Reaching the AdSense payout threshold; serving ads compliantly is the bar, revenue volume is the portfolio's problem.
- Booking/price/affiliate integrations, user accounts, a mobile app, realtime data.
- Restoring the Grok-platform install-page artwork.
