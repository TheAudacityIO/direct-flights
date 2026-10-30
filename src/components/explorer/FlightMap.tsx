import { useEffect, useRef } from "react";
import type {
  Map as MapLibreMap,
  FilterSpecification,
  GeoJSONSource,
  MapMouseEvent,
} from "maplibre-gl";
import { greatCircleCoords, splitAntimeridian } from "@/lib/flights/geo";
import type { AirportIndex, Destination } from "@/lib/flights/types";
import { useTheme, type Theme } from "@/lib/theme";

// Self-hosted basemap: one PMTiles archive (Protomaps planet build, z0-10)
// plus its sprites and fonts, served as read-only static files by nginx on
// atlas behind the tunnel at tiles.flydirectfrom.com. No third-party tile server, no key, no SLA to
// lose (CARTO watermarked its courtesy tiles on 2026-09-11; OpenFreeMap was
// the stopgap). Refresh recipe: docs/basemap.md. Style layers come from
// @protomaps/basemaps' dark or light flavor with the site's own background
// and land colours so the map matches the active theme.
const TILES_ORIGIN = "https://tiles.flydirectfrom.com/tiles";
const PMTILES_URL = `${TILES_ORIGIN}/world-z10.pmtiles`;
const BASEMAP_ATTRIBUTION =
  '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';

type BasemapsModule = typeof import("@protomaps/basemaps");

// Background, land and coastline per theme, shared by the basemap and the local fallback.
const GROUND: Record<Theme, { background: string; earth: string; outline: string }> = {
  dark: { background: "#08090c", earth: "#1a1f29", outline: "#2c3442" },
  light: { background: "#f6f5f1", earth: "#e4e1d9", outline: "#cfcbc2" },
};

// The stock light flavor tints land cover green and sand; flatten it to paper tones
// so the routes stay the only colour on the map, as they are in dark.
const LIGHT_LANDCOVER = {
  grassland: "#e0ddd4",
  barren: "#e8e5dd",
  urban_area: "#dcd9d1",
  farmland: "#e0ddd4",
  glacier: "#efede8",
  scrub: "#e2dfd7",
  forest: "#dcd9cf",
};

function basemapStyle(basemaps: BasemapsModule, theme: Theme) {
  const ground = GROUND[theme];
  const flavor = {
    ...basemaps.namedFlavor(theme),
    background: ground.background,
    earth: ground.earth,
    water: ground.background,
    ...(theme === "light" ? { landcover: LIGHT_LANDCOVER } : {}),
  };
  return {
    version: 8 as const,
    glyphs: `${TILES_ORIGIN}/assets/fonts/{fontstack}/{range}.pbf`,
    sprite: `${TILES_ORIGIN}/assets/sprites/v4/${theme}`,
    sources: {
      protomaps: {
        type: "vector" as const,
        url: `pmtiles://${PMTILES_URL}`,
        attribution: BASEMAP_ATTRIBUTION,
      },
    },
    layers: basemaps.layers("protomaps", flavor, { lang: "en" }),
  };
}

// The local fallback style declares its own credit on its source.

function localStyle(theme: Theme) {
  const ground = GROUND[theme];
  return {
    version: 8 as const,
    sources: {
      land: {
        type: "geojson" as const,
        data: "/data/land.geojson",
        attribution: "Land outlines from Natural Earth",
      },
    },
    layers: [
      {
        id: "background",
        type: "background" as const,
        paint: { "background-color": ground.background },
      },
      {
        id: "land",
        type: "fill" as const,
        source: "land",
        paint: { "fill-color": ground.earth },
      },
      {
        id: "land-outline",
        type: "line" as const,
        source: "land",
        paint: { "line-color": ground.outline, "line-width": 0.7 },
      },
    ],
  };
}

type Palette = {
  arc: string;
  arcDim: string;
  arcSel: string;
  arcDash: string;
  origin: string;
  originHalo: string;
  dest: string;
  pointStroke: string;
  selRing: string;
  selDest: string;
};

const PALETTES: Record<Theme, Palette> = {
  dark: {
    arc: "#7eb8c9",
    arcDim: "rgba(126, 184, 201, 0.62)",
    arcSel: "#e8f6f8",
    arcDash: "#ffffff",
    origin: "#f4f5f7",
    originHalo: "rgba(244,245,247,0.16)",
    dest: "#9fd4e0",
    pointStroke: "rgba(8,9,12,0.85)",
    selRing: "rgba(126,184,201,0.18)",
    selDest: "#ffffff",
  },
  light: {
    arc: "#2f6878",
    arcDim: "rgba(47, 104, 120, 0.55)",
    arcSel: "#14161b",
    arcDash: "#f6f5f1",
    origin: "#14161b",
    originHalo: "rgba(20,22,27,0.14)",
    dest: "#2f6878",
    pointStroke: "rgba(255,255,255,0.9)",
    selRing: "rgba(47,104,120,0.18)",
    selDest: "#14161b",
  },
};

// Selection focus: when a destination is picked, every other route recedes
// so the chosen arc reads as the only thing on the map.
const FADE_MS = { duration: 180, delay: 0 };
const ARC_WIDTH = 1.7;
const ARC_WIDTH_FADED = 1.1;
const ARC_OPACITY_FADED = 0.16;
const DEST_OPACITY = 0.92;
const DEST_OPACITY_FADED = 0.18;
const NO_MATCH: FilterSpecification = ["==", ["get", "iata"], ""];

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

function addLayers(map: MapLibreMap, pal: Palette) {
  if (map.getSource("arcs")) return;

  map.addSource("arcs", { type: "geojson", data: emptyFc() });
  map.addSource("sel-arc", { type: "geojson", data: emptyFc() });
  map.addSource("points", { type: "geojson", data: emptyFc() });

  map.addLayer({
    id: "arcs-dim",
    type: "line",
    source: "arcs",
    paint: {
      "line-color": pal.arcDim,
      "line-width": ARC_WIDTH,
      "line-width-transition": FADE_MS,
      "line-opacity": 1,
      "line-opacity-transition": FADE_MS,
      "line-blur": 0.15,
    },
    layout: { "line-cap": "round", "line-join": "round" },
  });

  map.addLayer({
    id: "sel-arc-glow",
    type: "line",
    source: "sel-arc",
    paint: {
      "line-color": pal.arc,
      "line-width": 12,
      "line-opacity": 0.32,
      "line-blur": 5,
    },
    layout: { "line-cap": "round" },
  });

  map.addLayer({
    id: "sel-arc",
    type: "line",
    source: "sel-arc",
    paint: {
      "line-color": pal.arcSel,
      "line-width": 3.5,
      "line-opacity": 1,
    },
    layout: { "line-cap": "round" },
  });

  map.addLayer({
    id: "sel-arc-dash",
    type: "line",
    source: "sel-arc",
    paint: {
      "line-color": pal.arcDash,
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
      "circle-color": pal.dest,
      "circle-stroke-width": 1,
      "circle-stroke-color": pal.pointStroke,
      "circle-opacity": DEST_OPACITY,
      "circle-opacity-transition": FADE_MS,
      "circle-stroke-opacity-transition": FADE_MS,
    },
  });

  map.addLayer({
    id: "sel-dest-ring",
    type: "circle",
    source: "points",
    filter: NO_MATCH,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 9, 4, 12, 7, 15],
      "circle-color": pal.selRing,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": pal.arcSel,
    },
  });

  map.addLayer({
    id: "sel-dest",
    type: "circle",
    source: "points",
    filter: NO_MATCH,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 4.5, 4, 6, 7, 8],
      "circle-color": pal.selDest,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": pal.pointStroke,
    },
  });

  map.addLayer({
    id: "origin-halo",
    type: "circle",
    source: "points",
    filter: ["==", ["get", "kind"], "origin"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 10, 4, 14, 7, 18],
      "circle-color": pal.originHalo,
    },
  });

  map.addLayer({
    id: "origin",
    type: "circle",
    source: "points",
    filter: ["==", ["get", "kind"], "origin"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 4, 4, 5.5, 7, 7],
      "circle-color": pal.origin,
      "circle-stroke-width": 2,
      "circle-stroke-color": pal.arc,
    },
  });
}

function applySelection(map: MapLibreMap, selectedIata: string | null) {
  if (selectedIata) {
    map.setPaintProperty("arcs-dim", "line-opacity", ARC_OPACITY_FADED);
    map.setPaintProperty("arcs-dim", "line-width", ARC_WIDTH_FADED);
    map.setPaintProperty("dests", "circle-opacity", DEST_OPACITY_FADED);
    map.setPaintProperty("dests", "circle-stroke-opacity", DEST_OPACITY_FADED);
    const match: FilterSpecification = ["==", ["get", "iata"], selectedIata];
    map.setFilter("sel-dest-ring", match);
    map.setFilter("sel-dest", match);
  } else {
    map.setPaintProperty("arcs-dim", "line-opacity", 1);
    map.setPaintProperty("arcs-dim", "line-width", ARC_WIDTH);
    map.setPaintProperty("dests", "circle-opacity", DEST_OPACITY);
    map.setPaintProperty("dests", "circle-stroke-opacity", 1);
    map.setFilter("sel-dest-ring", NO_MATCH);
    map.setFilter("sel-dest", NO_MATCH);
  }
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
  const theme = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  // Set once the map has loaded: the basemaps module, and whether the tile server failed over to the local style.
  const basemapsRef = useRef<BasemapsModule | null>(null);
  const localStyleRef = useRef(false);
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
        const [maplibreMod, workerMod, , pmtilesMod, basemapsMod] = await Promise.all([
          import("maplibre-gl"),
          import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
          import("maplibre-gl/dist/maplibre-gl.css"),
          import("pmtiles"),
          import("@protomaps/basemaps"),
        ]);
        if (cancelled || !containerRef.current) return;
        basemapsRef.current = basemapsMod;

        const { Map: MapLibre, setWorkerUrl, addProtocol } = maplibreMod;
        // v6 worker is a sibling of import.meta.url; Vite must emit it via ?worker&url.
        setWorkerUrl(workerMod.default);
        // pmtiles:// sources read tiles by HTTP range request straight from the archive.
        addProtocol("pmtiles", new pmtilesMod.Protocol().tile);

        reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        map = new MapLibre({
          container: containerRef.current,
          style: basemapStyle(basemapsMod, themeRef.current),
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
          if (styleAttempt === 1) {
            localStyleRef.current = true;
            map?.setStyle(localStyle(themeRef.current));
          }
        });

        const onReady = () => {
          if (!map || cancelled) return;
          addLayers(map, PALETTES[themeRef.current]);
          readyRef.current = true;
          map.resize();
          requestAnimationFrame(() => map?.resize());
          const p = propsRef.current;
          applyData(map, p.origin, p.destinations, p.selectedIata, p.compactPanel, PALETTES[themeRef.current]);

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

        const onFitInner = (ev: Event) => {
          if (!map || !readyRef.current) return;
          const p = propsRef.current;
          if (!p.origin) return;
          const pad = paddingFor(p.compactPanel);
          const keep = (ev as CustomEvent<{ keepSelection?: boolean } | undefined>).detail?.keepSelection;
          const selected = keep ? p.destinations.find((d) => d.iata === p.selectedIata) : undefined;
          if (selected) {
            fitAll(map, p.origin, [selected], p.compactPanel ? pad : { ...pad, left: 404 });
          } else {
            fitAll(map, p.origin, p.destinations, pad);
          }
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
    applyData(map, origin, destinations, selectedIata, compactPanel, PALETTES[themeRef.current]);
  }, [origin, destinations, selectedIata, compactPanel]);

  // Theme switch: a full style reload (diff off) so style.load re-adds the route layers in the new palette.
  const appliedThemeRef = useRef(theme);
  useEffect(() => {
    const map = mapRef.current;
    const basemaps = basemapsRef.current;
    if (!map || !basemaps || appliedThemeRef.current === theme) return;
    appliedThemeRef.current = theme;
    map.setStyle(localStyleRef.current ? localStyle(theme) : basemapStyle(basemaps, theme), {
      diff: false,
    });
  }, [theme]);

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
  pal: Palette,
) {
  if (!map.getSource("arcs")) addLayers(map, pal);

  const pad = paddingFor(compactPanel);

  if (!origin) {
    setSource(map, "arcs", emptyFc());
    setSource(map, "sel-arc", emptyFc());
    setSource(map, "points", emptyFc());
    applySelection(map, null);
    map.easeTo({ center: [12, 28], zoom: 1.55, duration: 700 });
    return;
  }

  const arcs = arcsGeoJSON(origin, destinations);
  setSource(map, "arcs", arcs);
  setSource(map, "points", pointsGeoJSON(origin, destinations));

  const selected = destinations.find((d) => d.iata === selectedIata) ?? null;
  applySelection(map, selected?.iata ?? null);
  if (selected) {
    setSource(map, "sel-arc", arcsGeoJSON(origin, [selected]));
    // Desktop shows the route card (360px at left 20px) over the map; keep
    // both ends of the selected route clear of it.
    fitAll(map, origin, [selected], compactPanel ? pad : { ...pad, left: 404 });
  } else {
    setSource(map, "sel-arc", emptyFc());
    fitAll(map, origin, destinations, pad);
  }
}
