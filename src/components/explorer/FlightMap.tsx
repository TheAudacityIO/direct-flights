import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import { greatCircleCoords, splitAntimeridian } from "@/lib/flights/geo";
import type { AirportIndex, Destination } from "@/lib/flights/types";

const STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const RASTER_FALLBACK = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#08090c" },
    },
    {
      id: "carto",
      type: "raster" as const,
      source: "carto",
      paint: { "raster-opacity": 0.92 },
    },
  ],
};

const LOCAL_STYLE = {
  version: 8 as const,
  sources: {
    land: {
      type: "geojson" as const,
      data: "/data/land.geojson",
    },
  },
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#08090c" },
    },
    {
      id: "land",
      type: "fill" as const,
      source: "land",
      paint: { "fill-color": "#1a1f29" },
    },
    {
      id: "land-outline",
      type: "line" as const,
      source: "land",
      paint: { "line-color": "#2c3442", "line-width": 0.7 },
    },
  ],
};

const ARC = "#7eb8c9";
const ARC_DIM = "rgba(126, 184, 201, 0.62)";
const ARC_SEL = "#e8f6f8";
const ORIGIN = "#f4f5f7";
const DEST = "#9fd4e0";

const DASH_SEQ: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

type Props = {
  origin: AirportIndex | null;
  destinations: Destination[];
  selectedIata: string | null;
  onSelectDest: (iata: string) => void;
  compactPanel: boolean;
};

type LineStringFC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { iata?: string; kind?: string };
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }>;
};

type PointFC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { iata?: string; kind?: string };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

type AnyFC = LineStringFC | PointFC;

function emptyFc(): AnyFC {
  return { type: "FeatureCollection", features: [] };
}

function arcsGeoJSON(
  origin: AirportIndex,
  destinations: Destination[],
): LineStringFC {
  const features: LineStringFC["features"] = [];
  for (const d of destinations) {
    const coords = greatCircleCoords(
      { lat: origin.lat, lon: origin.lon },
      { lat: d.lat, lon: d.lon },
      d.km > 4000 ? 64 : 32,
    );
    for (const part of splitAntimeridian(coords)) {
      features.push({
        type: "Feature",
        properties: { iata: d.iata, kind: "arc" },
        geometry: { type: "LineString", coordinates: part },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

function pointsGeoJSON(
  origin: AirportIndex | null,
  destinations: Destination[],
): PointFC {
  const features: PointFC["features"] = [];
  for (const d of destinations) {
    features.push({
      type: "Feature",
      properties: { iata: d.iata, kind: "dest" },
      geometry: { type: "Point", coordinates: [d.lon, d.lat] },
    });
  }
  if (origin) {
    features.push({
      type: "Feature",
      properties: { iata: origin.iata, kind: "origin" },
      geometry: { type: "Point", coordinates: [origin.lon, origin.lat] },
    });
  }
  return { type: "FeatureCollection", features };
}

function addLayers(map: MapLibreMap) {
  if (map.getSource("arcs")) return;

  map.addSource("arcs", { type: "geojson", data: emptyFc() });
  map.addSource("sel-arc", { type: "geojson", data: emptyFc() });
  map.addSource("points", { type: "geojson", data: emptyFc() });

  map.addLayer({
    id: "arcs-dim",
    type: "line",
    source: "arcs",
    paint: {
      "line-color": ARC_DIM,
      "line-width": 1.7,
      "line-opacity": 1,
      "line-blur": 0.15,
    },
    layout: { "line-cap": "round", "line-join": "round" },
  });

  map.addLayer({
    id: "sel-arc-glow",
    type: "line",
    source: "sel-arc",
    paint: {
      "line-color": ARC,
      "line-width": 6,
      "line-opacity": 0.22,
      "line-blur": 2.4,
    },
    layout: { "line-cap": "round" },
  });

  map.addLayer({
    id: "sel-arc",
    type: "line",
    source: "sel-arc",
    paint: {
      "line-color": ARC_SEL,
      "line-width": 2.1,
      "line-opacity": 0.95,
    },
    layout: { "line-cap": "round" },
  });

  map.addLayer({
    id: "sel-arc-dash",
    type: "line",
    source: "sel-arc",
    paint: {
      "line-color": "#ffffff",
      "line-width": 1.4,
      "line-dasharray": DASH_SEQ[0],
      "line-opacity": 0.9,
    },
    layout: { "line-cap": "round" },
  });

  map.addLayer({
    id: "dests",
    type: "circle",
    source: "points",
    filter: ["==", ["get", "kind"], "dest"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3.2, 4, 5, 7, 7],
      "circle-color": DEST,
      "circle-stroke-width": 1,
      "circle-stroke-color": "rgba(8,9,12,0.85)",
      "circle-opacity": 0.92,
    },
  });

  map.addLayer({
    id: "origin-halo",
    type: "circle",
    source: "points",
    filter: ["==", ["get", "kind"], "origin"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 10, 4, 14, 7, 18],
      "circle-color": "rgba(244,245,247,0.16)",
    },
  });

  map.addLayer({
    id: "origin",
    type: "circle",
    source: "points",
    filter: ["==", ["get", "kind"], "origin"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 4, 4, 5.5, 7, 7],
      "circle-color": ORIGIN,
      "circle-stroke-width": 2,
      "circle-stroke-color": ARC,
    },
  });
}

function setSource(map: MapLibreMap, id: string, data: AnyFC) {
  const src = map.getSource(id) as GeoJSONSource | undefined;
  src?.setData(data);
}

function paddingFor(compactPanel: boolean) {
  return compactPanel
    ? { top: 76, left: 16, right: 16, bottom: 16 }
    : { top: 88, left: 28, right: 380, bottom: 36 };
}

function fitAll(
  map: MapLibreMap,
  origin: AirportIndex,
  destinations: Destination[],
  pad: { top: number; left: number; right: number; bottom: number },
) {
  if (destinations.length === 0) {
    map.easeTo({ center: [origin.lon, origin.lat], zoom: 4, duration: 700 });
    return;
  }
  let minLon = origin.lon;
  let maxLon = origin.lon;
  let minLat = origin.lat;
  let maxLat = origin.lat;
  for (const d of destinations) {
    minLon = Math.min(minLon, d.lon);
    maxLon = Math.max(maxLon, d.lon);
    minLat = Math.min(minLat, d.lat);
    maxLat = Math.max(maxLat, d.lat);
  }
  if (maxLon - minLon > 180) {
    map.easeTo({ center: [origin.lon, origin.lat], zoom: 1.8, duration: 800 });
    return;
  }
  const lonPad = Math.max(1.5, (maxLon - minLon) * 0.1);
  const latPad = Math.max(1, (maxLat - minLat) * 0.1);
  map.fitBounds(
    [
      [minLon - lonPad, minLat - latPad],
      [maxLon + lonPad, maxLat + latPad],
    ],
    { padding: pad, maxZoom: 5, duration: 800 },
  );
}

export function FlightMap({
  origin,
  destinations,
  selectedIata,
  onSelectDest,
  compactPanel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelectDest);
  onSelectRef.current = onSelectDest;
  const propsRef = useRef({ origin, destinations, selectedIata, compactPanel });
  propsRef.current = { origin, destinations, selectedIata, compactPanel };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let map: MapLibreMap | undefined;
    let raf = 0;
    let dashStep = 0;
    let reduceMotion = false;
    let onZoomCmd: ((ev: Event) => void) | undefined;
    let onFitCmd: ((ev: Event) => void) | undefined;
    let styleAttempt = 0;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(el);

    (async () => {
      try {
        const [maplibreMod, workerMod] = await Promise.all([
          import("maplibre-gl"),
          import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]);
        if (cancelled || !containerRef.current) return;

        const { Map: MapLibre, setWorkerUrl } = maplibreMod;
        // v6 worker is a sibling of import.meta.url; Vite must emit it via ?worker&url.
        setWorkerUrl(workerMod.default);

        reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        map = new MapLibre({
          container: containerRef.current,
          style: STYLE_URL,
          center: [12, 28],
          zoom: 1.55,
          attributionControl: { compact: true },
          keyboard: false,
          pitchWithRotate: false,
          dragRotate: false,
          canvasContextAttributes: { antialias: true },
        });
        mapRef.current = map;

        map.on("error", (e) => {
          const msg = String((e as { error?: { message?: string } }).error?.message ?? "");
          const isStyle =
            msg.toLowerCase().includes("style") ||
            msg.toLowerCase().includes("fetch") ||
            msg.toLowerCase().includes("ajax");
          if (!isStyle) return;
          styleAttempt += 1;
          if (styleAttempt === 1) map?.setStyle(RASTER_FALLBACK);
          else if (styleAttempt === 2) map?.setStyle(LOCAL_STYLE);
        });

        const onReady = () => {
          if (!map || cancelled) return;
          addLayers(map);
          readyRef.current = true;
          map.resize();
          requestAnimationFrame(() => map?.resize());
          const p = propsRef.current;
          applyData(map, p.origin, p.destinations, p.selectedIata, p.compactPanel);

          if (!reduceMotion && !raf) {
            let last = 0;
            const tick = (ts: number) => {
              if (!map || cancelled) return;
              if (ts - last > 70) {
                last = ts;
                dashStep = (dashStep + 1) % DASH_SEQ.length;
                if (map.getLayer("sel-arc-dash")) {
                  map.setPaintProperty("sel-arc-dash", "line-dasharray", DASH_SEQ[dashStep]);
                }
              }
              raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
          }
        };

        map.on("load", onReady);
        map.on("style.load", () => {
          readyRef.current = false;
          onReady();
        });

        const pick = (e: MapMouseEvent) => {
          if (!map) return;
          const hits = map.queryRenderedFeatures(e.point, {
            layers: ["dests", "arcs-dim", "sel-arc"],
          });
          const iata = hits[0]?.properties?.iata as string | undefined;
          if (iata) onSelectRef.current(iata);
        };
        map.on("click", pick);

        const onMove = (e: MapMouseEvent) => {
          if (!map) return;
          const hits = map.queryRenderedFeatures(e.point, { layers: ["dests", "arcs-dim"] });
          map.getCanvas().style.cursor = hits.length ? "pointer" : "";
        };
        map.on("mousemove", onMove);

        const onZoomCmdInner = (ev: Event) => {
          const delta = (ev as CustomEvent<number>).detail;
          if (!map || typeof delta !== "number") return;
          map.zoomTo(map.getZoom() + delta, { duration: 180 });
        };
        onZoomCmd = onZoomCmdInner;
        window.addEventListener("direct-flights-zoom", onZoomCmdInner);

        const onFitInner = () => {
          if (!map || !readyRef.current) return;
          const p = propsRef.current;
          if (!p.origin) return;
          fitAll(map, p.origin, p.destinations, paddingFor(p.compactPanel));
        };
        onFitCmd = onFitInner;
        window.addEventListener("direct-flights-fit", onFitInner);
      } catch (err) {
        console.error("Map failed to start", err);
      }
    })();

    return () => {
      cancelled = true;
      readyRef.current = false;
      if (raf) cancelAnimationFrame(raf);
      if (onZoomCmd) window.removeEventListener("direct-flights-zoom", onZoomCmd);
      if (onFitCmd) window.removeEventListener("direct-flights-fit", onFitCmd);
      ro.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyData(map, origin, destinations, selectedIata, compactPanel);
  }, [origin, destinations, selectedIata, compactPanel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = window.setTimeout(() => map.resize(), 80);
    return () => window.clearTimeout(t);
  }, [origin, selectedIata, compactPanel]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full bg-bg"
      role="presentation"
      aria-hidden
    />
  );
}

function applyData(
  map: MapLibreMap,
  origin: AirportIndex | null,
  destinations: Destination[],
  selectedIata: string | null,
  compactPanel: boolean,
) {
  if (!map.getSource("arcs")) addLayers(map);

  const pad = paddingFor(compactPanel);

  if (!origin) {
    setSource(map, "arcs", emptyFc());
    setSource(map, "sel-arc", emptyFc());
    setSource(map, "points", emptyFc());
    map.easeTo({ center: [12, 28], zoom: 1.55, duration: 700 });
    return;
  }

  const arcs = arcsGeoJSON(origin, destinations);
  setSource(map, "arcs", arcs);
  setSource(map, "points", pointsGeoJSON(origin, destinations));

  const selected = destinations.find((d) => d.iata === selectedIata) ?? null;
  if (selected) {
    setSource(map, "sel-arc", arcsGeoJSON(origin, [selected]));
    fitAll(map, origin, [selected], pad);
  } else {
    setSource(map, "sel-arc", emptyFc());
    fitAll(map, origin, destinations, pad);
  }
}
