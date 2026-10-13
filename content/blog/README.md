# Blog post format

One file per post: `content/blog/<slug>.md` (slug = lowercase, dashes, becomes `/blog/<slug>`). This README is not a post.

```
---
title: Where can you fly direct from Cagliari?
description: 150-160 characters, the search snippet. Plain sentence, no clickbait.
date: 2026-10-13
category: Routes
airports: CAG, OLB, AHO
destination: Sardinia
partners: flights, hotels, activities, esim, insurance, compensation
---

Markdown body. No H1 (the title is the H1). Use ## and ### headings, lists, tables, links.
```

- `category`: one of Routes, Aerospace, Travel guides, Airports.
- `airports` (optional): IATA codes that have a file in `public/data/routes/`; rendered as "Airports in this post" links to `/from/{IATA}`.
- `destination` (optional): place name used to build the hotel/activity search links.
- `partners` (optional): which "Plan the trip" links to show. Values: flights, hotels, activities, esim, insurance, compensation.
- Internal links: airport pages as `/from/FCO`, other posts as `/blog/<slug>`.
- No raw HTML, no images, no affiliate URLs in the body: the page renders partner links from `partners`.
- Facts: cite a source link for any number that is not from our own dataset. Route data is mostly the ~2014 OpenFlights archive; only Cagliari (CAG) is observed (AeroDataBox, 30 days to 2026-10-05). Never present archive counts as current.
