---
title: Why flight paths look curved on a map
description: Flight routes look curved because a flat map distorts a round Earth. How great circles, map projections, ETOPS and polar routes shape the path a plane flies.
date: 2026-10-13
category: Aerospace
airports: JFK, HKG, LHR, MAD
partners: flights
---

Open our route map, pick New York JFK, and look at the line to Hong Kong. It does not cross the Pacific. It climbs north over Canada, bends across the top of the world and comes down through Asia. Pick London Heathrow and the line to New York bulges up towards the Canadian coast before dropping back down.

None of this is a drawing quirk. Those arcs are the shortest paths between the two airports. They look curved because a round planet has been flattened onto a rectangle. This guide explains what is going on, and why the route a real aircraft flies is often a little different again.

## The shortest path on a sphere is a great circle

A great circle is any circle on a sphere whose centre is the centre of the sphere. The equator is one. Every line of longitude, paired with the one opposite it, is one too. Slice a globe through its centre at any angle and the edge of the slice is a great circle.

The useful property is this: the shortest route between two points on a sphere always runs along the great circle that passes through both of them. You can check it at home with a globe and a piece of string. Pull the string tight between two cities and it settles on the great-circle path. On a globe the string looks straight. On a flat map, the same path usually looks bent.

Our map draws every route this way. For each pair of airports we calculate the great-circle line between them (using a mean Earth radius of 6,371 km), then sample points along it and project them onto the map. The distances we show on airport pages are great-circle distances, the same idea airlines and schedule databases use when they quote how far apart two cities are.

## Why the flat map makes it look bent

Our map, like most web maps, uses the Web Mercator projection. Mercator was designed for sea navigation in the 16th century, and it has one big strength: a line of constant compass bearing, called a rhumb line, is drawn as a straight line. A sailor could draw a straight line on a Mercator chart, read off the bearing and steer it.

The price is distortion. Mercator stretches everything more and more as you move away from the equator. The [classic example](https://en.wikipedia.org/wiki/Mercator_projection) is Greenland, which looks about the same size as Africa on a Mercator map, while Africa is in reality about 14 times larger. The same stretching bends great circles: apart from the equator and the meridians, a straight line on a Mercator map is not a great circle, and a great circle is not a straight line.

In practice, great-circle routes in the northern hemisphere bow towards the North Pole on the map. In the southern hemisphere they bow towards the South Pole. The further apart the two airports, and the further from the equator they sit, the bigger the bow.

## Three routes, three curves

We calculated these with the same great-circle formula our map uses. The "constant bearing" column is the length of the rhumb line, the path that would look straight on a Mercator map.

| Route | Great-circle distance | Constant-bearing path | Furthest north on the great circle |
|---|---|---|---|
| Madrid to New York JFK | 5,762 km | 5,932 km | about 46°N |
| London Heathrow to New York JFK | 5,540 km | 5,759 km | about 54°N |
| New York JFK to Hong Kong | 12,970 km | 16,346 km | about 84°N |

**Madrid and New York** sit at almost exactly the same latitude, a little over 40°N. You might expect the shortest path to run due west. It does not: the great circle rises to about 46°N in the middle of the Atlantic and saves around 170 km over the constant-bearing path. See it for yourself on [the Madrid page](/from/MAD).

**London to New York** starts further north, so the great circle climbs to about 54°N, passing south of Greenland and close to Newfoundland. On the map, the arc from [Heathrow](/from/LHR) looks like it takes a detour. It is the shortcut.

**New York to Hong Kong** is the dramatic one. The great circle passes within about 6 degrees of the North Pole. Following a constant bearing across the Pacific would add more than 3,000 km. On a Mercator map the polar path looks absurd, because the map stretches the Arctic enormously, but on a globe it is clearly the direct line. In our archive, [JFK](/from/JFK) to [Hong Kong](/from/HKG) is listed with Cathay Pacific, which is a good route to try on the map.

## Why real flights do not follow the line exactly

The great circle is the shortest path over the ground. Airlines care about the fastest and cheapest path through the air, and several things pull the real route away from the ideal.

### Winds

The jet stream is a band of strong westerly wind at cruising altitude. Flying with it can save more time than a few hundred extra kilometres cost, so eastbound flights over the North Atlantic often chase it, and westbound flights try to dodge it. Over the North Atlantic, controllers publish a fresh set of [organised tracks](https://en.wikipedia.org/wiki/North_Atlantic_Tracks) every day based on the forecast winds. We cover this in detail in [why westbound flights take longer](/blog/why-westbound-flights-take-longer).

### Airspace

Aircraft can only fly where they are permitted to. After the war in Ukraine began in 2022, Cathay Pacific and many other airlines stopped crossing Russian airspace. For a time, Cathay's New York to Hong Kong flight went the "wrong" way round the world, over the North Atlantic, Britain, Europe, the Black Sea and Turkey, adding about [2,254 miles to the normal 8,071 mile trip](https://thepointsguy.com/news/cathay-pacific-worlds-longest-flight). In late 2022 Cathay [returned to a polar routing](https://airlinegeeks.com/2022/10/31/cathay-pacific-set-to-resume-polar-routes-overflying-russian-airspace/) over Russia's far east, citing strong headwinds and payload limits on the alternative. Closures in the Middle East in 2026 have had a similar effect on flights between Europe and Australia.

### Diversion rules (ETOPS)

Twin-engine aircraft must stay within a set flying time of an airport where they could divert if an engine failed. Under US rules, any flight with a two-engine aircraft that goes beyond 60 minutes from an adequate airport, at one-engine-inoperative cruise speed in still air, is an extended operation, known as ETOPS, and needs specific approval. The FAA's [advisory circular on ETOPS and polar operations](https://www.faa.gov/documentlibrary/media/advisory_circular/120-42b.pdf) sets out how that works.

Modern long-haul twins are certified for long diversion times. In May 2014 the FAA [approved the Boeing 787-8 for up to 330 minutes](https://www.ainonline.com/aviation-news/air-transport/2014-05-28/faa-approves-boeing-787-330-minute-etops), although each airline still needs its own operational approval to use it. Later that year EASA [certified the Airbus A350 for up to 370 minutes](https://asianaviation.com/easa-certifies-a350-xwb-for-up-to-370-minute-etops/), which Airbus equated to about 2,500 nautical miles at one-engine speed. With limits that generous, almost any great circle is possible. On older aircraft with shorter approvals, routes over remote oceans had to bend towards islands and coastlines to stay within range of a diversion airport.

### Polar specifics

Flying close to the pole adds its own problems: very cold air that can chill fuel, few diversion airports, and communication and navigation considerations at high latitudes. The same FAA circular covers polar operations, which require extra planning and equipment. Airlines fly polar routes when the time saving is worth it, and route around the pole when winds or airspace make that better.

## How to read the arcs on our map

When you look at an airport page on flydirectfrom.com, keep these points in mind:

- **The arc is the theoretical shortest path.** It is the right line for comparing distances, and close to what airlines fly in calm conditions.
- **The real track can differ by hundreds of kilometres** on any given day because of winds, airspace and air traffic control.
- **Arcs bend more at high latitudes.** Routes from northern Europe or North America look more curved than routes near the equator, even at the same length.
- **Routes that cross the date line wrap around.** A flight from Asia to the Americas across the Pacific may appear as two pieces at the edges of the map. That is the map running out of width, not two flights.
- **The data underneath is mostly historical.** Except for Cagliari, which we observe directly, our route list comes from an archive of around 2014. Use the arcs to understand the geography, and check current schedules before you book.

For tips on using the map to find nonstop options from your own airport, see [how to find direct flights](/blog/how-to-find-direct-flights). If you are curious about the very longest great circles flown today, read our guide to the [longest nonstop flights in the world](/blog/longest-nonstop-flights-in-the-world).

## Frequently asked questions

### Why do planes fly over Greenland or Canada to get from Europe to the US west coast?

Because that is the shortest path. London to Los Angeles, for example, follows a great circle that reaches about 62°N near the southern tip of Greenland before crossing northern Canada. On a flat map it looks like a long detour north. On a globe it is the direct line.

### Is the shortest route on a map always a straight line?

Only on some maps, and only for some lines. On the Mercator-style maps used by most websites, straight lines are constant compass bearings, not shortest paths. A [gnomonic projection](https://en.wikipedia.org/wiki/Gnomonic_projection) is the type of map on which every great circle appears as a straight line, which is why navigators have used it for planning long routes.

### Do pilots fly the exact great circle?

Rarely all the way. Flight plans start from the great circle and then adjust for winds, airspace restrictions, published oceanic tracks and air traffic control. The aim is the lowest total time and fuel, not the shortest distance over the ground.

### Why does the line to Asia from New York go over the Arctic?

New York and Hong Kong are on opposite sides of the planet in longitude, and both are in the northern hemisphere. The shortest path between them passes near the North Pole. Following a constant bearing across the Pacific would be more than 3,000 km longer.

### Does the curve on your map mean the flight takes longer?

No. The curve is how the shortest path looks once a globe is flattened. A straight-looking line on the same map would actually be longer.
