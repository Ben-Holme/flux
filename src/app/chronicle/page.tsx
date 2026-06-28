"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo, startTransition } from "react";
import EVENT_TYPES from "@/components/story-events/event-types";
import { StoryEvent } from "@/components/story-events/use-story-events";
import SeasonTimeline from "@/components/story-events/season-timeline";
import { buildSeasons, getCurrentSeason } from "@/components/story-events/season-utils";
import type { Season } from "@/components/story-events/season-utils";
import { buildLookup } from "@/components/story-events/utils";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface LiveLoc {
  name: string;
  type: string;
  hostility: number;
  threeX: number;
  threeZ: number;
  radiusWorld: number;
  description?: string;
}

interface ApiSeason {
  name: string;
  days: number;
  start: string | null;
}

const GOLD = "#c8923a";

// Hostility tier colors
const H_WHITE  = "rgba(255,255,255,0.9)";
const H_RED    = "#ff5555";
const H_BLUE   = "#5588ff";
const H_YELLOW = "#ffcc44";

// Gold semi-transparent variants (rgb 200,146,58 = #c8923a)
const GOLD_BG     = "rgba(200,146,58,0.12)";
const GOLD_BORDER = "rgba(200,146,58,0.5)";

// Location name foreground (non-highlighted)
const LOC_NAME_FG = "rgba(255,255,255,0.85)";

function hostilityColor(h: number): string {
  switch (h) {
    case 1: return H_RED;
    case 2: return H_BLUE;
    case 3: return H_YELLOW;
    default: return H_WHITE;
  }
}

function locTypeIcon(type: string): string {
  switch (type) {
    case "city":
      return "/unyha-icons/Town.svg";
    case "monster":
      return "/unyha-icons/orc.svg";
    case "dungeon":
      return "/unyha-icons/dungeon.svg";
    case "mountain":
      return "/unyha-icons/Mountain.svg";
    default:
      return "/unyha-icons/Nav.svg";
  }
}
const HEIGHT_FOG_DENSITY = 2.5; // controls how quickly fog thins above sea level
const PAN_LIMIT = 10;

// Orbit constants
const R_MIN = 4,
  R_MAX = 35;
const ELEV_NEAR = Math.PI * (30 / 180); // camera elevation when close (30° from horizontal)
const ELEV_FAR = Math.PI / 2; // camera elevation when far (straight down)

const MAP_EXTENT = 406400; // fixed coordinate bounds — matches heightmap grid ±406400

function buildCloudTexture(): THREE.DataTexture {
  // DataTexture writes raw RGBA bytes — no HTML5 canvas premultiplied-alpha issues.
  const S = 512;
  const data = new Uint8ClampedArray(S * S * 4); // all zeros = fully transparent

  let seed = 99991;
  const rnd = () => {
    seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  };

  const addPuff = (cx: number, cy: number, rx: number, ry: number, cos: number, sin: number, maxA: number) => {
    const r = Math.max(rx, ry);
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(S - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(S - 1, Math.ceil(cy + r));
    const contrib = Math.round(maxA * 255);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy;
        const lx = dx * cos + dy * sin;
        const ly = -dx * sin + dy * cos;
        const t = (lx / rx) ** 2 + (ly / ry) ** 2;
        if (t >= 1) continue;
        const idx = (y * S + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] += Math.round(contrib * (1 - t)); // Uint8ClampedArray auto-clamps to 255
      }
    }
  };

  // Large elongated masses give the base cloud forms
  for (let k = 0; k < 70; k++) {
    const cx = rnd() * S, cy = rnd() * S;
    const rx = 35 + rnd() * 90;
    const ry = rx * (0.3 + rnd() * 0.35);
    const angle = rnd() * Math.PI;
    addPuff(cx, cy, rx, ry, Math.cos(angle), Math.sin(angle), 0.04 + rnd() * 0.11);
  }
  // Smaller puffs add detail and break up edge silhouettes
  for (let k = 0; k < 140; k++) {
    const cx = rnd() * S, cy = rnd() * S;
    const r = 6 + rnd() * 27;
    addPuff(cx, cy, r, r, 1, 0, 0.03 + rnd() * 0.09);
  }

  // Separable box blur on alpha only — 3 passes approximate Gaussian, one-time CPU cost ~5ms
  const blurAlpha = (radius: number) => {
    const a = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) a[i] = data[i * 4 + 3];
    const tmp = new Float32Array(S * S);
    const inv = 1 / (2 * radius + 1);
    for (let y = 0; y < S; y++) {
      let sum = 0;
      for (let x = 0; x < radius; x++) sum += a[y * S + x];
      for (let x = 0; x < S; x++) {
        sum += a[y * S + Math.min(S - 1, x + radius)];
        sum -= a[y * S + Math.max(0, x - radius - 1)];
        tmp[y * S + x] = sum * inv;
      }
    }
    for (let x = 0; x < S; x++) {
      let sum = 0;
      for (let y = 0; y < radius; y++) sum += tmp[y * S + x];
      for (let y = 0; y < S; y++) {
        sum += tmp[Math.min(S - 1, y + radius) * S + x];
        sum -= tmp[Math.max(0, y - radius - 1) * S + x];
        a[y * S + x] = sum * inv;
      }
    }
    for (let i = 0; i < S * S; i++) data[i * 4 + 3] = Math.round(a[i]);
  };
  blurAlpha(20); blurAlpha(20); blurAlpha(20);

  // Fade alpha to zero near all four edges so the plane boundary is never visible
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = Math.abs((x / (S - 1)) * 2 - 1); // 0 at centre, 1 at edge
      const ny = Math.abs((y / (S - 1)) * 2 - 1);
      const edge = Math.max(nx, ny);
      const u = Math.max(0, (edge - 0.65) / 0.35); // ramp from 65% to 100% of half-extent
      const fade = 1 - u * u * (3 - 2 * u);        // smoothstep
      const idx = (y * S + x) * 4;
      data[idx + 3] = Math.round(data[idx + 3] * fade);
    }
  }

  const tex = new THREE.DataTexture(new Uint8Array(data.buffer), S, S, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

function sampleHmHeight(data: Uint8ClampedArray, threeX: number, threeZ: number): number {
  const nx = threeX / 20 + 0.5;
  const ny = threeZ / 20 + 0.5;
  const ix = Math.min(511, Math.max(0, Math.round(nx * 511)));
  const iy = Math.min(511, Math.max(0, Math.round(ny * 511)));
  return data[(iy * 512 + ix) * 4] / 255;
}

type NavEntry =
  | { kind: "location"; locName: string }
  | { kind: "character"; charId: number }
  | { kind: "item"; itemId: string | number };

function getBreadcrumbLabel(
  entry: NavEntry,
  players: Record<string | number, { name: string; [key: string]: unknown }>,
  items: Record<string | number, string>,
): string {
  if (entry.kind === "location") return entry.locName;
  if (entry.kind === "character") {
    const raw = (players[entry.charId]?.name as string | undefined) ?? `#${entry.charId}`;
    return raw.split("#")[0] || `#${entry.charId}`;
  }
  if (entry.kind === "item") {
    const raw = (items[entry.itemId] as string | undefined) ?? `#${entry.itemId}`;
    return raw.split("#")[0] || raw;
  }
  return "";
}

function DetailPane({
  nav,
  liveLocs,
  players,
  items,
}: {
  nav: NavEntry;
  liveLocs: LiveLoc[];
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
}) {
  const statStyle = { fontSize: "0.6rem", textTransform: "uppercase" as const, letterSpacing: ".12em", color: "rgba(255,255,255,0.28)", marginBottom: "3px" };
  const valStyle = { fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", textTransform: "capitalize" as const };

  if (nav.kind === "location") {
    const loc = liveLocs.find((l) => l.name === nav.locName);
    return (
      <div style={{ padding: "8px 0" }}>
        {loc?.type && <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(255,255,255,0.25)", marginBottom: "6px" }}>{loc.type}</div>}
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginBottom: "10px" }}>{nav.locName}</div>
        {loc?.description && <p style={{ margin: "0 0 14px", fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.5)" }}>{loc.description}</p>}
        {loc != null && (
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div><div style={statStyle}>Type</div><div style={valStyle}>{loc.type}</div></div>
            <div>
              <div style={statStyle}>Hostility</div>
              <div style={valStyle}>{loc.hostility === 0 ? "Safe" : loc.hostility === 1 ? "Hostile" : loc.hostility === 2 ? "Guarded" : loc.hostility === 3 ? "Dangerous" : String(loc.hostility)}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (nav.kind === "character") {
    const player = players[nav.charId];
    const rawName = (player?.name as string | undefined) ?? `#${nav.charId}`;
    const parts = rawName.split("#").filter((p) => p && !p.startsWith("//"));
    const name = parts[0] || rawName;
    const house = parts[1] || null;
    const cls = parts[2] || null;
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginBottom: "10px" }}>{name}</div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {house && <div><div style={statStyle}>House</div><div style={valStyle}>{house}</div></div>}
          {cls && <div><div style={statStyle}>Class</div><div style={valStyle}>{cls}</div></div>}
        </div>
      </div>
    );
  }
  if (nav.kind === "item") {
    const raw = (items[nav.itemId] as string | undefined) ?? `#${nav.itemId}`;
    const itemName = raw.split("#")[0] || raw;
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>{itemName}</div>
      </div>
    );
  }
  return null;
}

function filterSeasonByNav(season: Season, nav: NavEntry | null): Season {
  if (!nav) return season;
  return {
    ...season,
    contextEvent: undefined,
    summaryEvent: undefined,
    days: season.days.map((day) => ({
      ...day,
      events: day.events.filter((e) => {
        if (nav.kind === "location") return e.location === nav.locName;
        if (nav.kind === "character") {
          const char2 = e.char2 as number | undefined;
          return e.primary_char === nav.charId || char2 === nav.charId;
        }
        if (nav.kind === "item") return String(e.item) === String(nav.itemId);
        return true;
      }),
    })),
  };
}

export default function ChroniclePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0)); // orbit pivot on terrain
  const radiusRef = useRef(15); // orbit radius (camera → target distance)
  const targetRadiusRef = useRef(15); // smooth zoom destination
  const debugRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<THREE.Vector3 | null>(null); // destination for smooth pan

  // Scene object refs for debug panel
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const leftLightRef = useRef<THREE.DirectionalLight | null>(null);
  const seaMatRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const cloudMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const terrainMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const heightFogUniformRef = useRef<{ value: number }>({ value: 1.0 });
  const heightFogDensityRef = useRef<{ value: number }>({ value: HEIGHT_FOG_DENSITY });
  const contrastUniformRef = useRef<{ value: number }>({ value: 1.0 });
  const terrainSeaSpecUniformRef = useRef<{ value: number }>({ value: 0.005 });
  const dispScaleRef = useRef(1);
  const revealAtRef = useRef<number[]>([]); // per-liveLocsRef index reveal threshold
  const hmDataRef = useRef<Uint8ClampedArray | null>(null); // decoded heightmap pixel data
  const locHeightsRef = useRef<number[]>([]); // terrain Y (0-1) per liveLoc index
  // Reusable Vector3 instances for the animation loop — avoids per-frame GC pressure
  const _v3a = useRef(new THREE.Vector3());
  const _v3b = useRef(new THREE.Vector3());
  const mountSizeRef = useRef({ w: 0, h: 0 });
  const needsRenderRef = useRef(true); // set true any time the scene must redraw

  // Interaction state
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const pinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const lastDragStateRef = useRef(false); // true if last pointer-up was a drag; guards overlay onClick
  const sheetDragActiveRef = useRef(false);
  const sheetDragStartYRef = useRef(0);
  const sheetDraggedRef = useRef(false);
  const sheetExpandedRef = useRef(false);
  const navStackLengthRef = useRef(0);
  const sheetElRef = useRef<HTMLDivElement | null>(null);
  const desktopAnimRef = useRef<HTMLDivElement | null>(null);
  const mobileAnimRef = useRef<HTMLDivElement | null>(null);
  const prevContentKeyRef = useRef<string>("root");
  const portraitGroupRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [liveLocs, setLiveLocs] = useState<LiveLoc[]>([]);
  const liveLocsRef = useRef<LiveLoc[]>([]);
  const locOverlayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const locRingSvgRefs = useRef<Map<number, SVGSVGElement>>(new Map());

  const [navStack, setNavStack] = useState<NavEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"events" | "details">("events");
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward");
  const [viewingSeasonIdx, setViewingSeasonIdx] = useState<number | null>(null); // null = latest
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [players, setPlayers] = useState<Record<string | number, { name: string }>>({});
  const [items, setItems] = useState<Record<string | number, string>>({});
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [apiSeasons, setApiSeasons] = useState<ApiSeason[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [dbgOpen, setDbgOpen] = useState(false);
  const [dbg, setDbg] = useState({
    ambient: true,
    dirLight: true,
    fillLight: true,
    leftLight: true,
    heightFog: true,
  });
  const [dirLightY, setDirLightY] = useState(45);
  const [dirLightZ, setDirLightZ] = useState(-25);
  const [seaSpec, setSeaSpec] = useState(0.065);
  const [terrainNormal, setTerrainNormal] = useState(0.6);
  const [heightScale, setHeightScale] = useState(1.8);
  const [contrast, setContrast] = useState(1.5);
  const [fogNear, setFogNear] = useState(R_MIN + 0.9 * (R_MAX - R_MIN));
  const fogNearRef = useRef(fogNear);
  const dbgRef = useRef(dbg); // mutable mirror — read by animate loop without triggering renders

  // Lock body scroll and hide footer while this page is mounted
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("chronicle-page");
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("chronicle-page");
    };
  }, []);

  useEffect(() => {
    fetch("https://api.unyhagame.com/ueserv/getLocations-w.php")
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK" || !data.locs) return;
        const parsed: LiveLoc[] = [];
        for (const [name, loc] of Object.entries(
          data.locs as Record<
            string,
            {
              underground: string;
              type: string;
              location: string;
              radius: string;
              hostility?: string;
              description?: string;
            }
          >,
        )) {
          if (loc.underground === "true") continue;
          const match = loc.location.match(/X=([-\d.]+)\s+Y=([-\d.]+)/);
          if (!match) continue;
          const ueX = parseFloat(match[1]);
          const ueY = parseFloat(match[2]);
          parsed.push({
            name,
            type: loc.type,
            hostility: parseInt(loc.hostility ?? "0") || 0,
            threeX: (ueX / MAP_EXTENT) * 10,
            threeZ: (ueY / MAP_EXTENT) * 10,
            radiusWorld: (parseFloat(loc.radius) / MAP_EXTENT) * 10,
            description: loc.description,
          });
        }
        setLiveLocs(parsed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const eventsReq = fetch("https://api.unyhagame.com/ueserv/getstoryevents-w.php").then((r) =>
      r.json(),
    );
    const namesReq = fetch("https://api.unyhagame.com/ueserv/getplayernames-w.php")
      .then((r) => r.json())
      .catch(() => null);
    Promise.all([eventsReq, namesReq])
      .then(([evData, namesData]) => {
        const arr: StoryEvent[] = Array.isArray(evData) ? evData : (evData.events ?? []);
        setEvents([...arr].reverse());
        if (namesData) {
          const playerList = namesData.players ?? namesData.chars ?? namesData;
          if (Array.isArray(playerList)) {
            const map: Record<string | number, { name: string }> = {};
            (playerList as Record<string, unknown>[]).forEach((p) => {
              const id = p.id ?? p.char_id ?? p.player_id;
              if (id != null) map[id as string] = p as { name: string };
            });
            setPlayers(map);
          }
          setItems(buildLookup(namesData.items ?? {}));
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    fetch("https://api.unyhagame.com/ueserv/getSeasons-w.php")
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "OK" && Array.isArray(data.seasons)) setApiSeasons(data.seasons);
      })
      .catch(() => {});
  }, []);

  // useLayoutEffect fires before paint so mobile users never see the desktop panel flash
  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-pan to the location with the most current-season events on first load
  const autoFocusedRef = useRef(false);
  useEffect(() => {
    if (autoFocusedRef.current || events.length === 0 || liveLocs.length === 0) return;
    const season = getCurrentSeason(buildSeasons(events));
    if (!season) return;
    const counts = new Map<string, number>();
    for (const ev of season.days.flatMap((d) => d.events)) {
      if (ev.location) counts.set(ev.location, (counts.get(ev.location) ?? 0) + 1);
    }
    let bestName: string | null = null;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) { bestCount = count; bestName = name; }
    }
    if (!bestName) return;
    const idx = liveLocs.findIndex((l) => l.name === bestName);
    if (idx === -1) return;
    const loc = liveLocs[idx];
    autoFocusedRef.current = true;
    focusTargetRef.current = new THREE.Vector3(
      Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeX)),
      (locHeightsRef.current[idx] ?? 0) * dispScaleRef.current,
      Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeZ)),
    );
    targetRadiusRef.current = Math.max(R_MIN, Math.min(R_MAX, loc.radiusWorld * 10));
  }, [events, liveLocs]);

  useEffect(() => {
    dbgRef.current = dbg;
    if (ambientRef.current) ambientRef.current.visible = dbg.ambient;
    if (dirLightRef.current) dirLightRef.current.visible = dbg.dirLight;
    if (fillLightRef.current) fillLightRef.current.visible = dbg.fillLight;
    if (leftLightRef.current) leftLightRef.current.visible = dbg.leftLight;
    heightFogUniformRef.current.value = dbg.heightFog ? 1.0 : 0.0;
  }, [dbg]);

  useEffect(() => {
    if (dirLightRef.current) dirLightRef.current.position.set(0, dirLightY, dirLightZ);
  }, [dirLightY, dirLightZ]);

  useEffect(() => {
    if (seaMatRef.current) seaMatRef.current.specular.setRGB(seaSpec, seaSpec, seaSpec);
    terrainSeaSpecUniformRef.current.value = seaSpec;
  }, [seaSpec]);

  useEffect(() => {
    if (terrainMatRef.current) terrainMatRef.current.normalScale.set(terrainNormal, terrainNormal);
  }, [terrainNormal]);

  useEffect(() => {
    contrastUniformRef.current.value = contrast;
  }, [contrast]);

  useEffect(() => {
    fogNearRef.current = fogNear;
  }, [fogNear]);

  useEffect(() => {
    dispScaleRef.current = heightScale;
    if (terrainMatRef.current) terrainMatRef.current.displacementScale = heightScale;
    heightFogDensityRef.current.value =
      heightScale > 0 ? HEIGHT_FOG_DENSITY / heightScale : HEIGHT_FOG_DENSITY;
  }, [heightScale]);

  useEffect(() => {
    sheetExpandedRef.current = sheetExpanded;
  }, [sheetExpanded]);
  useEffect(() => {
    navStackLengthRef.current = navStack.length;
  }, [navStack]);
  useEffect(() => {
    liveLocsRef.current = liveLocs;
    // revealAt tied directly to radiusWorld: small locations disappear as soon as you
    // zoom out past their natural scale; big-text locations (radiusWorld >= 0.66, matching
    // the label size threshold) are pinned above R_MAX so they're fully visible at max zoom-out.
    const out: number[] = new Array(liveLocs.length);
    liveLocs.forEach((l, i) => {
      // Continuous scale: larger radius = visible from further out. Factor 20 puts a
      // radiusWorld ~1.9 location at R_MAX; anything bigger is always visible.
      out[i] = Math.min(R_MAX + 3, Math.max(R_MIN + 2, l.radiusWorld * 20));
    });
    revealAtRef.current = out;
    if (hmDataRef.current)
      locHeightsRef.current = liveLocs.map((l) =>
        sampleHmHeight(hmDataRef.current!, l.threeX, l.threeZ),
      );
    needsRenderRef.current = true;
  }, [liveLocs]);

  // Decode heightmap once; re-sample loc heights if liveLocs already loaded
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 512, 512);
      const data = ctx.getImageData(0, 0, 512, 512).data;
      hmDataRef.current = data;
      if (liveLocsRef.current.length > 0)
        locHeightsRef.current = liveLocsRef.current.map((l) =>
          sampleHmHeight(data, l.threeX, l.threeZ),
        );
    };
    img.src = "/heightmap.png";
  }, []);

  const seasons = useMemo(() => buildSeasons(events), [events]);
  const currentSeason = seasons[seasons.length - 1] ?? null; // latest season — used for map effects
  // apiSeasons may include ancient seasons with no events; built seasons are
  // numbered 1..M from oldest-with-events. Subtract the offset so API season
  // index N maps to built season N - (apiSeasons.length - seasons.length).
  const seasonOffset = apiSeasons.length > 0 ? apiSeasons.length - seasons.length : 0;
  const resolveSeasonNum = (viewingSeasonIdx ?? apiSeasons.length) - seasonOffset;
  const viewingSeason = resolveSeasonNum >= 1 ? (seasons.find((s) => s.number === resolveSeasonNum) ?? null) : null;
  const seasonEvents = useMemo(
    () => (currentSeason ? currentSeason.days.flatMap((d) => d.events) : []),
    [currentSeason],
  );
  const eventLocNames = useMemo(
    () => new Set(seasonEvents.map((e) => e.location).filter(Boolean) as string[]),
    [seasonEvents],
  );
  const viewingSeasonEvents = useMemo(
    () => (viewingSeason ? viewingSeason.days.flatMap((d) => d.events) : []),
    [viewingSeason],
  );

  // Per-location top-3 characters by fame within the viewing season only.
  const locPortraits = useMemo(() => {
    const locIdxByName = new Map(liveLocs.map((l, i) => [l.name, i]));
    const charToLocIdx = new Map<number, number>();
    for (const ev of viewingSeasonEvents) {
      if (!ev.location || ev.primary_char == null) continue;
      if (charToLocIdx.has(ev.primary_char)) continue;
      const locIdx = locIdxByName.get(ev.location);
      if (locIdx !== undefined) charToLocIdx.set(ev.primary_char, locIdx);
    }
    const data: Record<number, Array<{ charId: number; fame: number }>> = {};
    for (const [cid, locIdx] of charToLocIdx) {
      const parts = (players[cid]?.name ?? "").split("#");
      const fame = parseInt(parts[4] ?? "0") || 0;
      if (!data[locIdx]) data[locIdx] = [];
      data[locIdx].push({ charId: cid, fame });
    }
    Object.values(data).forEach((arr) => {
      arr.sort((a, b) => b.fame - a.fame);
      arr.splice(3);
    });
    return data;
  }, [viewingSeasonEvents, players, liveLocs]);

  // Build Three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;
    mountSizeRef.current = { w: W, h: H };

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Atmospheric fog — density driven by zoom in animate loop; set before first render so shaders compile with USE_FOG
    scene.fog = new THREE.FogExp2(0x0a0d0f, 0); // matches heightFogColor vec3(0.04,0.05,0.06)
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    cameraRef.current = camera;

    // Post-processing: render + output
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.13);
    scene.add(ambient);
    ambientRef.current = ambient;

    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    dirLight.position.set(0, 45, -25);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0x4466aa, 1.5);
    fillLight.position.set(0, 45, 25);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const leftLight = new THREE.DirectionalLight(0xfff8f0, 1.2);
    leftLight.position.set(-8, 8, 0);
    leftLight.castShadow = true;
    scene.add(leftLight);
    leftLightRef.current = leftLight;

    // Load real heightmap PNG as displacement texture
    const dispTexture = new THREE.TextureLoader().load("/heightmap.png");

    // Terrain plane: 20×20 world units, 256×256 segments
    const terrainSize = 20;
    const segments = 256;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);

    // Color texture from world map jpg
    const colorTexture = new THREE.TextureLoader().load("/worldMap.jpg");
    colorTexture.wrapS = colorTexture.wrapT = THREE.ClampToEdgeWrapping;
    const mapScale = 1.015;
    const mapOffset = (1 - mapScale) / 2;
    colorTexture.repeat.set(mapScale, mapScale);
    colorTexture.offset.set(mapOffset, mapOffset);

    const normalTexture = new THREE.TextureLoader().load("/normalmap.png");
    const specTexture = new THREE.TextureLoader().load("/specmap.png");
    specTexture.wrapS = specTexture.wrapT = THREE.ClampToEdgeWrapping;
    specTexture.repeat.set(mapScale, mapScale);
    specTexture.offset.set(mapOffset, mapOffset);

    const seaNormalTexture = buildSeaNormalMap();

    const mat = new THREE.MeshStandardMaterial({
      map: colorTexture,
      displacementMap: dispTexture,
      displacementScale: dispScaleRef.current,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(terrainNormal, terrainNormal),
      roughness: 0.85,
      metalness: 0.05,
    });

    // Height-based fog: vWorldY carries the displaced world-Y per vertex
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeightFogEnabled = heightFogUniformRef.current;
      shader.uniforms.uHeightFogDensity = heightFogDensityRef.current;
      shader.uniforms.uContrast = contrastUniformRef.current;
      shader.uniforms.uSpecMask = { value: specTexture };
      shader.uniforms.uSeaNormalMap = { value: seaNormalTexture };
      shader.uniforms.uSeaNormalScale = { value: new THREE.Vector2(0.8, 0.8) };
      shader.uniforms.uSeaNormalTiling = { value: new THREE.Vector2(32, 32) };
      shader.uniforms.uSeaSpec = terrainSeaSpecUniformRef.current;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <fog_pars_vertex>",
          "#include <fog_pars_vertex>\nvarying float vWorldY;\nvarying vec2 vWorldXZ;",
        )
        .replace(
          "#include <displacementmap_vertex>",
          "#include <displacementmap_vertex>\nvec4 worldPos = modelMatrix * vec4(transformed, 1.0);\nvWorldY = worldPos.y;\nvWorldXZ = worldPos.xz;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <fog_pars_fragment>",
          "#include <fog_pars_fragment>\nvarying float vWorldY;\nvarying vec2 vWorldXZ;\nuniform float uHeightFogEnabled;\nuniform float uHeightFogDensity;\nuniform float uContrast;\nuniform sampler2D uSpecMask;\nuniform sampler2D uSeaNormalMap;\nuniform vec2 uSeaNormalScale;\nuniform vec2 uSeaNormalTiling;\nuniform float uSeaSpec;",
        )
        .replace(
          "#include <map_fragment>",
          "#include <map_fragment>\ndiffuseColor.rgb = (diffuseColor.rgb - 0.5) * uContrast + 0.5;",
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          float specMask = texture2D(uSpecMask, vMapUv).r;
          if (specMask > 0.0) {
            vec2 seaUv = (vWorldXZ / 50.0 + 0.5) * uSeaNormalTiling;
            vec3 seaNormalTexel = texture2D(uSeaNormalMap, seaUv).xyz * 2.0 - 1.0;
            seaNormalTexel.xy *= uSeaNormalScale;
            vec3 seaNormal = normalize(tbn * seaNormalTexel);
            float specStrength = clamp(uSeaSpec / 0.005, 0.0, 1.0);
            float normalBlend = specMask * 0.9 * specStrength;
            normal = normalize(mix(normal, seaNormal, normalBlend));
          }`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          float specMaskRoughness = texture2D(uSpecMask, vMapUv).r;
          float specStrengthRoughness = clamp(uSeaSpec / 0.005, 0.0, 1.0);
          float wetRoughness = mix(roughnessFactor, 0.25, specStrengthRoughness);
          roughnessFactor = mix(roughnessFactor, wetRoughness, specMaskRoughness);`,
        )
        .replace(
          "#include <fog_fragment>",
          `#include <fog_fragment>
          {
            float heightFog = exp(-vWorldY * uHeightFogDensity) * uHeightFogEnabled;
            heightFog = clamp(heightFog, 0.0, 0.8);
            vec3 heightFogColor = vec3(0.04, 0.05, 0.06);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, heightFogColor, heightFog);
          }`,
        );
    };
    mat.customProgramCacheKey = () => "terrain-height-fog";

    terrainMatRef.current = mat;
    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotation.x = -Math.PI / 2; // lay flat
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Procedural noise normal map for the sea surface
    function buildSeaNormalMap(): THREE.CanvasTexture {
      const SIZE = 512;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      const hash = (x: number, y: number) => {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
      };
      const valueNoise = (x: number, y: number) => {
        const ix = Math.floor(x),
          iy = Math.floor(y);
        const fx = x - ix,
          fy = y - iy;
        const ux = fx * fx * (3 - 2 * fx),
          uy = fy * fy * (3 - 2 * fy);
        const a = hash(ix, iy),
          b = hash(ix + 1, iy);
        const c = hash(ix, iy + 1),
          d = hash(ix + 1, iy + 1);
        return a + (b - a) * ux + (c - a) * uy + (d - b - c + a) * ux * uy;
      };

      // 4-octave fBm height field — higher SCALE = finer waves, lower K = less steep
      const SCALE = 16;
      const heights = new Float32Array(SIZE * SIZE);
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const sx = (px / SIZE) * SCALE,
            sy = (py / SIZE) * SCALE;
          let v = 0,
            amp = 0.5,
            freq = 1;
          for (let i = 0; i < 4; i++) {
            v += valueNoise(sx * freq, sy * freq) * amp;
            amp *= 0.5;
            freq *= 2;
          }
          heights[py * SIZE + px] = v;
        }
      }

      // Tangent-space normals via finite differences
      const K = 1;
      const img = ctx.createImageData(SIZE, SIZE);
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const hL = heights[py * SIZE + Math.max(0, px - 1)];
          const hR = heights[py * SIZE + Math.min(SIZE - 1, px + 1)];
          const hU = heights[Math.max(0, py - 1) * SIZE + px];
          const hD = heights[Math.min(SIZE - 1, py + 1) * SIZE + px];
          const dx = (hR - hL) * K,
            dy = (hD - hU) * K;
          const len = Math.sqrt(dx * dx + dy * dy + 1);
          const base = (py * SIZE + px) * 4;
          img.data[base] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
          img.data[base + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
          img.data[base + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
          img.data[base + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(32, 32);
      return tex;
    }

    // Sea disc — specular dark water with subtle noise normals, edge fade to black
    const seaGeo = new THREE.CircleGeometry(25, 128);
    const seaMat = new THREE.MeshPhongMaterial({
      color: 0x42555a,
      specular: new THREE.Color(seaSpec, seaSpec, seaSpec),
      shininess: 750,
      normalMap: seaNormalTexture,
      normalScale: new THREE.Vector2(0.8, 0.8),
      transparent: true,
      depthWrite: false,
    });
    seaMat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeightFogEnabled = heightFogUniformRef.current;
      shader.uniforms.uHeightFogDensity = heightFogDensityRef.current;
      shader.vertexShader =
        `varying float vDiscDist;\n` +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        vDiscDist = length(position.xy) / 25.0;`,
        );
      shader.fragmentShader =
        `varying float vDiscDist;\nuniform float uHeightFogEnabled;\nuniform float uHeightFogDensity;\n` +
        shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
        float fade = smoothstep(0.7, 1.0, vDiscDist);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.0), fade);
        gl_FragColor.a *= 1.0 - smoothstep(0.96, 1.0, vDiscDist);
        float seaFog = exp(-0.005 * uHeightFogDensity) * uHeightFogEnabled;
        seaFog = clamp(seaFog, 0.0, 0.8);
        vec3 heightFogColor = vec3(0.04, 0.05, 0.06);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, heightFogColor, seaFog);`,
        );
    };
    seaMat.customProgramCacheKey = () => "sea-height-fog";
    seaMatRef.current = seaMat;
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.005;
    sea.renderOrder = 0;
    scene.add(sea);

    // Cloud layer — flat plane well above peaks, fades out as camera zooms in
    const cloudMat = new THREE.MeshBasicMaterial({
      map: buildCloudTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    cloudMatRef.current = cloudMat;
    const cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), cloudMat);
    cloudMesh.rotation.x = -Math.PI / 2;
    cloudMesh.position.y = 5.7;
    scene.add(cloudMesh);

    scene.add(camera);
    updateCameraFromOrbit(); // set initial position + lookAt from orbit state

    // Force-compile all shader programs upfront so the first interaction doesn't stall
    renderer.compile(scene, camera);

    // Animation loop — idle state tracking to skip composer.render() when nothing moves
    let prevRadius = radiusRef.current;
    let prevTargetX = targetRef.current.x;
    let prevTargetZ = targetRef.current.z;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      if (focusTargetRef.current) {
        targetRef.current.lerp(focusTargetRef.current, 0.08);
        if (targetRef.current.distanceTo(focusTargetRef.current) < 0.01) {
          targetRef.current.copy(focusTargetRef.current);
          focusTargetRef.current = null;
        }
      }
      // Smooth zoom
      radiusRef.current += (targetRadiusRef.current - radiusRef.current) * 0.12;

      // Detect movement since last frame; skip render entirely when settled
      const moved =
        Math.abs(radiusRef.current - prevRadius) > 0.0001 ||
        Math.abs(targetRef.current.x - prevTargetX) > 0.0001 ||
        Math.abs(targetRef.current.z - prevTargetZ) > 0.0001;
      prevRadius = radiusRef.current;
      prevTargetX = targetRef.current.x;
      prevTargetZ = targetRef.current.z;

      if (!moved && !draggingRef.current && !needsRenderRef.current) return;
      needsRenderRef.current = false;

      updateCameraFromOrbit();
      if (debugRef.current) debugRef.current.textContent = `r: ${radiusRef.current.toFixed(2)}`;

      // Portrait overlays: project world positions to screen coords
      if (portraitGroupRefs.current.size > 0 && mount) {
        const portraitOpacity = Math.max(0, Math.min(1, (15 - radiusRef.current) / 3));
        const { w: W, h: H } = mountSizeRef.current;
        portraitGroupRefs.current.forEach((el, locIdx) => {
          const liveLoc = liveLocsRef.current[locIdx];
          if (!liveLoc) return;
          const h = locHeightsRef.current[locIdx] ?? 0;
          _v3a.current.set(liveLoc.threeX, h * dispScaleRef.current + 0.08, liveLoc.threeZ).project(camera);
          const sx = ((_v3a.current.x + 1) / 2) * W;
          const sy = ((-_v3a.current.y + 1) / 2) * H;
          el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
          el.style.opacity = portraitOpacity.toFixed(3);
        });
      }

      // Location overlays: project world positions to screen coords
      if (locOverlayRefs.current.size > 0 && mount) {
        const { w: locW, h: locH } = mountSizeRef.current;
        locOverlayRefs.current.forEach((el, i) => {
          const loc = liveLocsRef.current[i];
          if (!loc) return;
          const revealAt = revealAtRef.current[i] ?? R_MAX;
          const zoomOutOpacity = Math.max(0, Math.min(1, (revealAt - radiusRef.current) / 3));
          // Fully solid at focus zoom (radiusWorld*10), fade over 5 units when zooming in further
          const focusZoom = loc.radiusWorld * 10;
          const zoomInOpacity = Math.max(0, Math.min(1, (radiusRef.current - focusZoom + 5) / 5));
          const zoomOpacity = zoomOutOpacity * zoomInOpacity;
          // Fade locations that are far from the camera orbit target
          const dx = loc.threeX - targetRef.current.x;
          const dz = loc.threeZ - targetRef.current.z;
          const distFromTarget = Math.sqrt(dx * dx + dz * dz);
          const visR = radiusRef.current * 0.55;
          const fadeW = Math.max(2.5, visR * 0.4);
          const distOpacity = Math.max(0, Math.min(1, (visR - distFromTarget) / fadeW));
          const locOpacity = Math.min(1, zoomOpacity * distOpacity * (loc.type === "city" ? 1.2 : 1));
          el.style.pointerEvents = locOpacity > 0 ? "auto" : "none";
          const worldY = (locHeightsRef.current[i] ?? 0.5) * dispScaleRef.current + 0.08;
          _v3a.current.set(loc.threeX, worldY, loc.threeZ).project(camera);
          if (_v3a.current.z > 1) {
            el.style.opacity = "0";
            return;
          }
          const sx = ((_v3a.current.x + 1) / 2) * locW;
          const sy = ((-_v3a.current.y + 1) / 2) * locH;
          el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
          el.style.opacity = locOpacity.toFixed(3);
          const svg = locRingSvgRefs.current.get(i);
          if (svg && loc.radiusWorld > 0) {
            _v3b.current.set(loc.threeX + loc.radiusWorld, worldY, loc.threeZ).project(camera);
            const ox = ((_v3b.current.x + 1) / 2) * locW;
            const oy = ((-_v3b.current.y + 1) / 2) * locH;
            const pr = Math.max(0, Math.sqrt((ox - sx) ** 2 + (oy - sy) ** 2));
            // scale() is compositor-only — no layout reflow, unlike setAttribute on width/height
            svg.style.transform = `scale(${pr.toFixed(2)})`;
          }
        });
      }

      // Clouds fade in as camera pulls back (radius 10 → 20); max opacity 0.75
      if (cloudMatRef.current) {
        cloudMatRef.current.opacity = Math.max(0, Math.min(1, (radiusRef.current - 10) / 10)) * 0.75;
      }

      // Fog ramps in over the last 15% of [R_MIN, FOG_THRESHOLD]; threshold set by fogNearRef
      const FOG_THRESHOLD = fogNearRef.current;
      const fogBand = 0.15 * (FOG_THRESHOLD - R_MIN);
      const fogStart = R_MIN + fogBand;
      const fogT = Math.max(0, Math.min(1, (fogStart - radiusRef.current) / fogBand));
      (scene.fog as THREE.FogExp2).density = fogT * 0.2;
      heightFogUniformRef.current.value = (dbgRef.current.heightFog ? 1.0 : 0.0) * (1 - fogT);

      composer.render();
    }
    animate();

    // Resize handler — also caches dimensions so animate loop avoids layout reads
    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth,
        h = mount.clientHeight;
      mountSizeRef.current = { w, h };
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Orbit helper: position camera and lookAt from target + radius
  function updateCameraFromOrbit() {
    const camera = cameraRef.current;
    if (!camera) return;
    const target = targetRef.current;
    const r = radiusRef.current;
    const raw = (r - R_MIN) / (R_MAX - R_MIN);
    const t = Math.max(0, Math.min(1, raw));
    const elev = ELEV_NEAR + (ELEV_FAR - ELEV_NEAR) * (t * t * (3 - 2 * t));
    camera.position.set(target.x, target.y + r * Math.sin(elev), target.z + r * Math.cos(elev));
    camera.lookAt(target);
  }

  // Pan: translate target (and camera follows) horizontally
  function panCamera(dx: number, dy: number) {
    const mount = mountRef.current;
    if (!mount) return;
    const scale = (radiusRef.current / mount.clientHeight) * 1.6;
    targetRef.current.x = Math.max(
      -PAN_LIMIT,
      Math.min(PAN_LIMIT, targetRef.current.x - dx * scale),
    );
    targetRef.current.z = Math.max(
      -PAN_LIMIT,
      Math.min(PAN_LIMIT, targetRef.current.z - dy * scale),
    );
  }

  // Zoom: change orbit radius, keeping target fixed
  function zoomCamera(factor: number) {
    const step = Math.max(0.5, targetRadiusRef.current) * 0.1334;
    targetRadiusRef.current = Math.min(
      R_MAX,
      Math.max(R_MIN, targetRadiusRef.current + (factor < 1 ? -step : step)),
    );
  }

  // Wheel zoom
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      focusTargetRef.current = null;
      const isWheel = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 40;
      const normalized = isWheel ? Math.sign(e.deltaY) * 40 : e.deltaY;
      const step = Math.max(0.5, targetRadiusRef.current) * 0.006;
      targetRadiusRef.current = Math.min(
        R_MAX,
        Math.max(R_MIN, targetRadiusRef.current + normalized * step),
      );
    };
    mount.addEventListener("wheel", onWheel, { passive: false });
    return () => mount.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: catches pointer releases missed by onPointerUp/Cancel (system interrupts, etc.)
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const onLostCapture = (e: PointerEvent) => {
      if (!activePointersRef.current.has(e.pointerId)) return; // already handled
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        lastPinchDistRef.current = null;
        pinchMidRef.current = null;
      }
      if (activePointersRef.current.size === 0) {
        draggingRef.current = false;
        pointerStartRef.current = null;
      } else if (activePointersRef.current.size === 1) {
        const [rem] = Array.from(activePointersRef.current.values());
        lastPosRef.current = rem;
        draggingRef.current = true;
      }
    };
    mount.addEventListener("lostpointercapture", onLostCapture);
    return () => mount.removeEventListener("lostpointercapture", onLostCapture);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mount = mountRef.current;
    if (!mount) return;
    // Only capture on the 3D canvas, not on UI overlays. Without this guard,
    // setPointerCapture redirects pointerup to the mount, which prevents the
    // click event from reaching the overlay's onClick handler.
    if (e.currentTarget === mount) {
      mount.setPointerCapture(e.pointerId);
    }
    const cssX = e.clientX - mount.getBoundingClientRect().left;
    const cssY = e.clientY - mount.getBoundingClientRect().top;
    activePointersRef.current.set(e.pointerId, { x: cssX, y: cssY });

    if (activePointersRef.current.size > 2) {
      // spurious 3rd+ pointer (stale entries from missed releases) — clear and restart single-touch
      activePointersRef.current.clear();
      activePointersRef.current.set(e.pointerId, { x: cssX, y: cssY });
      lastPinchDistRef.current = null;
      pinchMidRef.current = null;
      lastPosRef.current = { x: cssX, y: cssY };
      pointerStartRef.current = { x: cssX, y: cssY };
      draggingRef.current = false;
    } else if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchMidRef.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      draggingRef.current = true;
    } else {
      lastPosRef.current = { x: cssX, y: cssY };
      pointerStartRef.current = { x: cssX, y: cssY };
      draggingRef.current = false;
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    const mount = mountRef.current;
    if (!mount) return;
    const rect = mount.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    activePointersRef.current.set(e.pointerId, { x: cssX, y: cssY });

    if (activePointersRef.current.size >= 2) {
      const pts = Array.from(activePointersRef.current.values());
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const newMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

      if (lastPinchDistRef.current !== null && pinchMidRef.current) {
        const prevMid = pinchMidRef.current;
        // Zoom
        if (lastPinchDistRef.current > 0) {
          focusTargetRef.current = null;
          // Direct proportional zoom — zoomCamera() only checks sign, so bypassing it here
          const rawFactor = lastPinchDistRef.current / newDist;
          const dampened = 1 + (rawFactor - 1) * 0.8;
          targetRadiusRef.current = Math.min(R_MAX, Math.max(R_MIN, targetRadiusRef.current * dampened));
        }
        // Pan from midpoint delta
        focusTargetRef.current = null;
        panCamera(newMid.x - prevMid.x, newMid.y - prevMid.y);
      }
      lastPinchDistRef.current = newDist;
      pinchMidRef.current = newMid;
      return;
    }

    if (draggingRef.current) {
      focusTargetRef.current = null;
      panCamera(cssX - lastPosRef.current.x, cssY - lastPosRef.current.y);
      lastPosRef.current = { x: cssX, y: cssY };
      return;
    }

    if (
      pointerStartRef.current &&
      Math.hypot(cssX - pointerStartRef.current.x, cssY - pointerStartRef.current.y) > 5
    ) {
      draggingRef.current = true;
      lastPosRef.current = { x: cssX, y: cssY };
    }

    mount.style.cursor = draggingRef.current ? "grabbing" : "grab";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    const wasPinching = activePointersRef.current.size >= 2;
    activePointersRef.current.delete(e.pointerId);

    if (wasPinching) {
      lastPinchDistRef.current = null;
      pinchMidRef.current = null;
      if (activePointersRef.current.size === 1) {
        const [rem] = Array.from(activePointersRef.current.values());
        lastPosRef.current = rem;
        pointerStartRef.current = rem;
        draggingRef.current = true;
      }
      return;
    }

    if (!draggingRef.current && mountRef.current?.contains(e.target as Node)) {
      // Only deselect when tapping the canvas itself — overlay taps are handled by their own onClick
      startTransition(() => setNavStack([]));
    }
    lastDragStateRef.current = draggingRef.current;
    draggingRef.current = false;
    pointerStartRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
      pinchMidRef.current = null;
    }
    draggingRef.current = false;
  }, []);

  // Register move/up/cancel on document so they fire even when pointer is
  // captured by an overlay element (cross-element setPointerCapture is unreliable).
  useEffect(() => {
    const cast = (fn: (e: React.PointerEvent<HTMLDivElement>) => void) =>
      (e: PointerEvent) => fn(e as unknown as React.PointerEvent<HTMLDivElement>);
    const move = cast(onPointerMove);
    const up = cast(onPointerUp);
    const cancel = cast(onPointerCancel);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
    };
  }, [onPointerMove, onPointerUp, onPointerCancel]);

  const onSheetHandlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sheetDragActiveRef.current = true;
    sheetDraggedRef.current = false;
    sheetDragStartYRef.current = e.clientY;
    if (sheetElRef.current) sheetElRef.current.style.transition = "none";
  }, []);

  const onSheetHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!sheetDragActiveRef.current) return;
    const raw = e.clientY - sheetDragStartYRef.current;
    if (Math.abs(raw) > 5) sheetDraggedRef.current = true;
    const isExpanded = sheetExpandedRef.current;
    const hasNav = navStackLengthRef.current > 0;
    const isHalf = isExpanded && !hasNav;
    const delta = Math.max(!isExpanded ? -150 : 0, Math.min(200, raw));
    const el = sheetElRef.current;
    if (!el) return;
    const peekPx = navStackLengthRef.current > 0 ? 175 : 120;
    if (!isExpanded) el.style.transform = `translateY(calc(100% - ${peekPx}px + ${delta}px))`;
    else if (isHalf) el.style.transform = `translateY(calc(50% + ${delta}px))`;
    else el.style.transform = `translateY(${delta}px)`;
  }, []);

  const sheetSnapTransform = useCallback((expanded: boolean) => {
    if (!expanded) {
      const peekPx = navStackLengthRef.current > 0 ? 175 : 120;
      return `translateY(calc(100% - ${peekPx}px))`;
    }
    return navStackLengthRef.current > 0 ? "translateY(0px)" : "translateY(50%)";
  }, []);

  const onSheetHandlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!sheetDragActiveRef.current) return;
    sheetDragActiveRef.current = false;
    const delta = e.clientY - sheetDragStartYRef.current;
    const didDrag = sheetDraggedRef.current;
    const isExpanded = sheetExpandedRef.current;

    let newExpanded = isExpanded;
    if (didDrag) {
      if (!isExpanded && delta < -30) newExpanded = true;
      else if (isExpanded && delta > 30) newExpanded = false;
    }

    const el = sheetElRef.current;
    if (el) {
      el.style.transition = "transform 0.3s ease";
      el.style.transform = sheetSnapTransform(newExpanded);
    }

    if (newExpanded !== isExpanded) setSheetExpanded(newExpanded);
  }, [sheetSnapTransform]);

  const onSheetHandlePointerCancel = useCallback(() => {
    if (!sheetDragActiveRef.current) return;
    sheetDragActiveRef.current = false;
    sheetDraggedRef.current = false;
    const isExpanded = sheetExpandedRef.current;
    const el = sheetElRef.current;
    if (el) {
      el.style.transition = "transform 0.3s ease";
      el.style.transform = sheetSnapTransform(isExpanded);
    }
  }, [sheetSnapTransform]);

  const getSeasonLabel = (n: number) => {
    const api = apiSeasons[n - 1];
    return api?.name ?? `Season ${n}`;
  };
  // Use viewingSeasonIdx directly so the label matches the select even when
  // viewingSeason falls back to currentSeason (no events for that season).
  const displaySeasonNum = viewingSeasonIdx ?? apiSeasons.length;
  const currentApiSeason = apiSeasons[displaySeasonNum - 1] ?? null;

  const clearNav = useCallback(() => {
    setSlideDir("back");
    startTransition(() => {
      setNavStack([]);
      setActiveTab("events");
    });
    setSheetExpanded(true); // show half-state (no nav → sheet sits at 50%)
  }, []);

  const popNav = useCallback(() => {
    setSlideDir("back");
    startTransition(() => {
      setNavStack((prev) => prev.slice(0, -1));
      setActiveTab("events");
    });
  }, []);

  const handleCharClick = useCallback((charId: number) => {
    setSlideDir("forward");
    startTransition(() => {
      setNavStack((prev) => [...prev, { kind: "character", charId }]);
      setActiveTab("events");
    });
  }, []);

  const handleItemClick = useCallback((itemId: string | number) => {
    setSlideDir("forward");
    startTransition(() => {
      setNavStack((prev) => [...prev, { kind: "item", itemId }]);
      setActiveTab("events");
    });
  }, []);

  const handleLocClick = useCallback((locName: string) => {
    const locIdx = liveLocs.findIndex((l) => l.name === locName);
    setSlideDir("forward");
    startTransition(() => {
      setNavStack([{ kind: "location", locName }]);
      setActiveTab("events");
    });
    if (locIdx !== -1) {
      const loc = liveLocs[locIdx];
      focusTargetRef.current = new THREE.Vector3(
        Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeX)),
        (locHeightsRef.current[locIdx] ?? 0) * dispScaleRef.current,
        Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeZ)),
      );
      targetRadiusRef.current = Math.max(R_MIN, Math.min(R_MAX, loc.radiusWorld * 10));
    }
  }, [liveLocs]);

  // Derive location visual selection from navStack (for map ring + z-index)
  const navLocEntry = navStack.find((e) => e.kind === "location") as { kind: "location"; locName: string } | undefined;
  const selectedIdx = navLocEntry ? liveLocs.findIndex((l) => l.name === navLocEntry.locName) : -1;

  const currentNav = navStack[navStack.length - 1] ?? null;

  // Slide animation — triggered imperatively so React can reuse EventCard DOM
  // instead of destroying + recreating it (which key= would force).
  const contentKey = navStack.map((e) =>
    e.kind === "location" ? `L:${e.locName}` : e.kind === "character" ? `C:${e.charId}` : `I:${String(e.itemId)}`
  ).join(">") || "root";

  useEffect(() => {
    if (contentKey === prevContentKeyRef.current) return;
    prevContentKeyRef.current = contentKey;
    if (contentKey === "root") return;
    const anim = `chronicle-${slideDir} 0.22s ease both`;
    [desktopAnimRef.current, mobileAnimRef.current].forEach((el) => {
      if (!el) return;
      el.style.animation = "none";
      void el.offsetHeight; // force reflow so browser registers the reset
      el.style.animation = anim;
    });
  }, [contentKey, slideDir]);

  const displaySeason = useMemo(
    () => (viewingSeason ? filterSeasonByNav(viewingSeason, currentNav) : null),
    [viewingSeason, currentNav],
  );

  // Pre-filter all seasons for the "all seasons" view so filterSeasonByNav isn't called
  // per-season inside the JSX render (which would re-run on every unrelated re-render).
  const filteredSeasons = useMemo(
    () => [...seasons].reverse().map((season) => ({
      season,
      filtered: filterSeasonByNav(season, currentNav),
    })),
    [seasons, currentNav],
  );

  const navBarTitle = currentNav ? getBreadcrumbLabel(currentNav, players, items) : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--map-bg)]">
      <style>{`
        @keyframes chronicle-forward { from { transform: translateX(28px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes chronicle-back    { from { transform: translateX(-28px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      {/* Three.js mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 cursor-grab touch-none"
        onPointerDown={onPointerDown}
      />

      {/* Location overlays — below portrait overlays */}
      <div className="pointer-events-none touch-none absolute inset-0 z-[6]">
        {liveLocs.map((loc, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) locOverlayRefs.current.set(i, el);
              else locOverlayRefs.current.delete(i);
            }}
            style={{
              opacity: 0,
              zIndex: selectedIdx === i ? 999 : parseInt(loc.threeZ.toFixed(0)), // ensure selected location is always on top
            }}
            className="absolute top-0 left-0 touch-none cursor-pointer hover:z-[999]! hover:opacity-100!"
            onPointerDown={onPointerDown}
            onWheel={(e) => {
              focusTargetRef.current = null;
              const isWheel = e.nativeEvent.deltaMode !== 0 || Math.abs(e.deltaY) >= 40;
              const normalized = isWheel ? Math.sign(e.deltaY) * 40 : e.deltaY;
              const step = Math.max(0.5, targetRadiusRef.current) * 0.006;
              targetRadiusRef.current = Math.min(
                R_MAX,
                Math.max(R_MIN, targetRadiusRef.current + normalized * step),
              );
            }}
            onClick={() => {
              if (lastDragStateRef.current) return;
              setSlideDir("forward");
              startTransition(() => {
                setNavStack([{ kind: "location", locName: loc.name }]);
                setActiveTab("events");
              });
              focusTargetRef.current = new THREE.Vector3(
                Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeX)),
                (locHeightsRef.current[i] ?? 0) * dispScaleRef.current,
                Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeZ)),
              );
              targetRadiusRef.current = Math.max(R_MIN, Math.min(R_MAX, loc.radiusWorld * 10));
            }}
          >
            {/* Radius ring — fixed 2×2 SVG scaled via transform; avoids layout reflow on every frame */}
            {selectedIdx === i && (
              <svg
                ref={(el) => {
                  if (el) { locRingSvgRefs.current.set(i, el); needsRenderRef.current = true; }
                  else locRingSvgRefs.current.delete(i);
                }}
                className="pointer-events-none absolute overflow-visible"
                width="2"
                height="2"
                viewBox="-1 -1 2 2"
                style={{ left: "-1px", top: "-1px", transformOrigin: "1px 1px" }}
              >
                <circle cx="0" cy="0" r="1" fill="none" stroke="#fff3" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            <div
              className="transition-transform hover:scale-120"
              style={{ transform: selectedIdx === i ? "scale(1.2)" : undefined }}
            >
              {/* Icon — centered on world point */}
              <div
                style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: 32,
                  height: 32,
                  WebkitMaskImage: `url(${locTypeIcon(loc.type)})`,
                  maskImage: `url(${locTypeIcon(loc.type)})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  backgroundColor: hostilityColor(loc.hostility),
                  filter: "drop-shadow(0 0 6px rgba(0,0,0,1)) drop-shadow(0 1px 3px rgba(0,0,0,0.9))",
                }}
              />
              {/* Label — below icon */}
              <span
                style={{
                  fontSize:
                    loc.radiusWorld < 0.33 ? "12px" : loc.radiusWorld < 0.66 ? "16px" : "20px",
                  textTransform: loc.radiusWorld < 0.66 ? "none" : "uppercase",
                  letterSpacing: loc.radiusWorld < 0.66 ? "0" : "0.3em",
                }}
                className="absolute translate-x-[-50%] pt-4 tracking-[0.03em] whitespace-nowrap text-white text-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              >
                {loc.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Portrait overlays — positions updated each frame via portraitGroupRefs */}
      <div className="pointer-events-none absolute inset-0 z-[7] overflow-hidden">
        {Object.entries(locPortraits).map(([idxStr, chars]) => {
          const locIdx = parseInt(idxStr);
          return (
            <div
              key={locIdx}
              ref={(el) => {
                if (el) portraitGroupRefs.current.set(locIdx, el);
                else portraitGroupRefs.current.delete(locIdx);
              }}
              className="absolute top-0 left-0"
              style={{ opacity: 0 }}
            >
              {chars.map((c, rank) => {
                const size = rank === 0 ? 48 : 32;
                const offsets = [
                  { left: -24, top: -58 },
                  { left: -60, top: -42 },
                  { left: 28, top: -42 },
                ][rank];
                const initial =
                  (players[c.charId]?.name ?? "?").split("#")[0]?.[0]?.toUpperCase() ?? "?";
                return (
                  <div
                    key={String(c.charId)}
                    className="absolute"
                    style={{ left: offsets.left, top: offsets.top, width: size, height: size }}
                  >
                    <img
                      src={`https://api.unyhagame.com/ueserv/chars/${c.charId}.png`}
                      className="absolute inset-0 h-full w-full rounded-full border-2 border-black/75 object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="absolute inset-0 hidden items-center justify-center rounded-full border-2 border-black/75 bg-[#2a3d3e] font-semibold text-white/85 select-none"
                      style={{ fontSize: rank === 0 ? 18 : 13 }}
                    >
                      {initial}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Debug overlay */}
      <div
        ref={debugRef}
        className="pointer-events-none absolute bottom-2 left-2 z-30 font-mono text-[11px] text-white/50"
      />

      {/* Debug panel */}
      <div className="absolute top-2 right-2 z-30 select-none">
        <button
          onClick={() => setDbgOpen((o) => !o)}
          className="ml-auto block cursor-pointer rounded border border-white/10 bg-black/55 px-2 py-0.5 font-mono text-[0.75rem] text-white/45"
        >
          ⚙
        </button>
        {dbgOpen &&
          (() => {
            const row = (key: keyof typeof dbg, label: string, extra?: (v: boolean) => void) => (
              <label key={key} className="mb-0.5 flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={dbg[key]}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setDbg((p) => ({ ...p, [key]: v }));
                    extra?.(v);
                  }}
                  style={{ cursor: "pointer", accentColor: GOLD }}
                />
                <span className="font-mono text-[0.7rem] text-white/50">{label}</span>
              </label>
            );
            const sliderRow = (
              label: string,
              value: number,
              min: number,
              max: number,
              step: number,
              onChange: (v: number) => void,
            ) => (
              <label className="mb-[5px] flex flex-col gap-0.5">
                <span className="flex justify-between font-mono text-[0.7rem] text-white/50">
                  <span>{label}</span>
                  <span>{value}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: GOLD }}
                />
              </label>
            );
            const sec = (text: string, first?: boolean) => (
              <div
                className={`text-[0.58rem] tracking-[0.1em] text-white/25 uppercase ${first ? "mb-1.5" : "mt-2 mb-1.5"}`}
              >
                {text}
              </div>
            );
            return (
              <div className="mt-1 min-w-[180px] rounded-md border border-white/8 bg-black/85 px-3 py-2.5">
                {sec("Lights", true)}
                {row("ambient", "Ambient")}
                {row("dirLight", "Dir light")}
                {row("fillLight", "Fill light")}
                {row("leftLight", "Left light")}
                {sec("Dir light pos")}
                {sliderRow("Y", dirLightY, 0, 50, 1, setDirLightY)}
                {sliderRow("Z", dirLightZ, -50, 50, 1, setDirLightZ)}
                {sec("Terrain")}
                {sliderRow("Normals", terrainNormal, 0, 3, 0.05, setTerrainNormal)}
                {sliderRow("Height scale", heightScale, 0, 5, 0.1, setHeightScale)}
                {sliderRow("Contrast", contrast, 0.5, 4, 0.05, setContrast)}
                {sec("Sea")}
                {sliderRow("Specular", seaSpec, 0, 0.2, 0.005, setSeaSpec)}
                {sec("Effects")}
                {row("heightFog", "Height fog")}
                {sliderRow("Fog near", fogNear, R_MIN, R_MAX, 0.5, setFogNear)}
              </div>
            );
          })()}
      </div>

      {/* Season selector — eyebrow overlay at top-center of map */}
      {apiSeasons.length > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2"
          style={{ left: !isMobile ? "calc(50% - 170px)" : "50%", top: !isMobile ? "46px" : "38px" }}
        >
          <div className="pointer-events-auto relative flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3 py-1.5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            <span className="pointer-events-none select-none font-heading text-[0.6rem] tracking-[0.14em] uppercase text-white/55">
              {viewingSeasonIdx === 0
                ? "All seasons"
                : getSeasonLabel(displaySeasonNum) + (displaySeasonNum === apiSeasons.length ? " · Current" : "")}
            </span>
            <span className="pointer-events-none select-none text-[0.65rem] text-white/35">⚙</span>
            <select
              value={viewingSeasonIdx ?? apiSeasons.length}
              onChange={(e) => {
                const num = Number(e.target.value);
                setViewingSeasonIdx(num === apiSeasons.length ? null : num);
                setNavStack([]);
                setSlideDir("back");
              }}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
            >
              <option value={0}>All seasons</option>
              {apiSeasons.map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getSeasonLabel(i + 1)}{i === apiSeasons.length - 1 ? " — Current season" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className="bg-gold inline-block h-2 w-2 rounded-full"
            style={{ boxShadow: `0 0 6px ${GOLD}` }}
          />
          <span className="text-[0.68rem] tracking-[0.06em] text-white/40">Has events</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[rgba(136,136,136,0.8)]" />
          <span className="text-[0.68rem] tracking-[0.06em] text-white/40">Location</span>
        </div>
        <div className="mt-1 text-[0.62rem] tracking-[0.04em] text-white/25">
          Scroll / pinch to zoom · drag to pan
        </div>
      </div>

      {/* Desktop side panel — always visible, shows season timeline */}
      {!isMobile && (
        <div className="absolute top-0 right-0 bottom-0 z-20 flex w-[min(340px,90vw)] flex-col border-l border-white/7 bg-[var(--panel-bg)]">
          {/* Sticky header */}
          <div className="shrink-0 px-4 pt-20 pb-2">
            {/* iOS-style nav bar */}
            {navStack.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: "14px", minHeight: "36px" }}>
                <div style={{ width: "32px", display: "flex", justifyContent: "flex-start", flexShrink: 0 }}>
                  {navStack.length > 1 && (
                    <button
                      onClick={popNav}
                      style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, padding: "4px", lineHeight: 1 }}
                    >
                      <span style={{ fontSize: "1.3rem", lineHeight: 1, display: "block" }}>‹</span>
                    </button>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-heading)", fontSize: "0.9rem", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", padding: "0 4px" }}>
                  {navBarTitle}
                </div>
                <div style={{ width: "32px", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                  <button
                    onClick={clearNav}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "1.2rem", lineHeight: 1, padding: "4px" }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {/* Location description */}
            {currentNav?.kind === "location" && selectedIdx !== -1 && liveLocs[selectedIdx]?.description && (
              <p style={{ margin: "0 0 10px", fontSize: "0.75rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
                {liveLocs[selectedIdx].description}
              </p>
            )}
            {/* Tab bar */}
            {navStack.length > 0 && (
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {(["events", "details"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "none", border: "none", padding: "6px 12px", cursor: "pointer",
                      fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".12em",
                      fontFamily: "var(--font-heading)",
                      color: activeTab === tab ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                      borderBottom: activeTab === tab ? `2px solid ${GOLD}` : "2px solid transparent",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
            <div ref={desktopAnimRef}>
              {/* Details — always mounted when nav active; shown/hidden via CSS to avoid remounting events */}
              {currentNav && (
                <div style={{ display: activeTab === "details" ? "block" : "none" }}>
                  <DetailPane nav={currentNav} liveLocs={liveLocs} players={players} items={items} />
                </div>
              )}
              {/* Events — hidden when details tab is active */}
              <div style={{ display: activeTab === "details" && currentNav ? "none" : "block" }}>
                {viewingSeasonIdx === 0 ? (
                  seasons.length > 0 ? filteredSeasons.map(({ season, filtered }) => {
                    if (currentNav && !filtered.days.some((d) => d.events.length > 0)) return null;
                    return (
                      <div key={season.number} style={{ marginBottom: "32px" }}>
                        <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          {getSeasonLabel(season.number + seasonOffset)}
                        </div>
                        <SeasonTimeline season={filtered} players={players} items={items} onCharClick={handleCharClick} onItemClick={handleItemClick} onLocClick={handleLocClick} />
                      </div>
                    );
                  }) : eventsLoading ? (
                    <p className="mt-4 text-[0.78rem] text-white/30">Loading events…</p>
                  ) : (
                    <p className="mt-4 text-[0.78rem] text-white/20 italic">No events yet.</p>
                  )
                ) : displaySeason ? (
                  <SeasonTimeline
                    season={displaySeason}
                    players={players}
                    items={items}
                    onCharClick={handleCharClick}
                    onItemClick={handleItemClick}
                    onLocClick={handleLocClick}
                  />
                ) : eventsLoading ? (
                  <p className="mt-4 text-[0.78rem] text-white/30">Loading events…</p>
                ) : (
                  <p className="mt-4 text-[0.78rem] text-white/20 italic">No events yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet — season timeline, always draggable */}
      {isMobile && (
        <div
          ref={sheetElRef}
          className="fixed right-0 bottom-0 left-0 z-20 flex h-[80vh] flex-col overflow-hidden rounded-t-2xl bg-[var(--sheet-bg)]"
          style={{
            transform: !sheetExpanded
              ? navStack.length > 0 ? "translateY(calc(100% - 175px))" : "translateY(calc(100% - 120px))"
              : navStack.length > 0 ? "translateY(0px)" : "translateY(50%)",
            transition: "transform 0.3s ease",
          }}
        >
          {/* Drag handle */}
          <div
            className="flex shrink-0 cursor-pointer touch-none justify-center pt-3 pb-2"
            onPointerDown={onSheetHandlePointerDown}
            onPointerMove={onSheetHandlePointerMove}
            onPointerUp={onSheetHandlePointerUp}
            onPointerCancel={onSheetHandlePointerCancel}
            onClick={() => !sheetDraggedRef.current && setSheetExpanded((v) => !v)}
          >
            <div className="h-1 w-9 rounded-sm bg-white/25" />
          </div>

          {/* Nav controls — always visible when a location/char/item is selected */}
          {navStack.length > 0 && (
            <div className="shrink-0 px-4 pt-1 pb-0">
              {/* iOS-style nav bar */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px", minHeight: "36px" }}>
                <div style={{ width: "32px", display: "flex", justifyContent: "flex-start", flexShrink: 0 }}>
                  {navStack.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); popNav(); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, padding: "4px", lineHeight: 1 }}
                    >
                      <span style={{ fontSize: "1.3rem", lineHeight: 1, display: "block" }}>‹</span>
                    </button>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-heading)", fontSize: "0.9rem", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", padding: "0 4px" }}>
                  {navBarTitle}
                </div>
                <div style={{ width: "32px", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearNav(); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "1.2rem", lineHeight: 1, padding: "4px" }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Location description */}
              {currentNav?.kind === "location" && selectedIdx !== -1 && liveLocs[selectedIdx]?.description && (
                <p style={{ margin: "0 0 10px", fontSize: "0.75rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
                  {liveLocs[selectedIdx].description}
                </p>
              )}
              {/* Tab bar — only visible when expanded */}
              {sheetExpanded && (
                <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {(["events", "details"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: "none", border: "none", padding: "6px 12px", cursor: "pointer",
                        fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".12em",
                        fontFamily: "var(--font-heading)",
                        color: activeTab === tab ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                        borderBottom: activeTab === tab ? `2px solid ${GOLD}` : "2px solid transparent",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No-nav peek — collapsed season name (no location selected) */}
          {navStack.length === 0 && !sheetExpanded && (
            <div
              className="flex shrink-0 cursor-pointer items-center px-5 pt-1 pb-3"
              onClick={() => !sheetDraggedRef.current && setSheetExpanded(true)}
            >
              {viewingSeason ? (
                <div className="font-heading text-[0.9rem] tracking-[0.15em] uppercase text-white/60">
                  {getSeasonLabel(displaySeasonNum)}
                </div>
              ) : (
                <div className="text-[0.8rem] text-white/30">Story Events</div>
              )}
            </div>
          )}

          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto px-4 pt-3 pb-8"
            style={{ opacity: sheetExpanded ? 1 : 0, pointerEvents: sheetExpanded ? "auto" : "none", transition: "opacity 0.15s ease" }}
          >
            <div ref={mobileAnimRef}>
              {currentNav && (
                <div style={{ display: activeTab === "details" ? "block" : "none" }}>
                  <DetailPane nav={currentNav} liveLocs={liveLocs} players={players} items={items} />
                </div>
              )}
              <div style={{ display: activeTab === "details" && currentNav ? "none" : "block" }}>
                {viewingSeasonIdx === 0 ? (
                  seasons.length > 0 ? filteredSeasons.map(({ season, filtered }) => {
                    if (currentNav && !filtered.days.some((d) => d.events.length > 0)) return null;
                    return (
                      <div key={season.number} style={{ marginBottom: "32px" }}>
                        <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          {getSeasonLabel(season.number + seasonOffset)}
                        </div>
                        <SeasonTimeline season={filtered} players={players} items={items} onCharClick={handleCharClick} onItemClick={handleItemClick} onLocClick={handleLocClick} />
                      </div>
                    );
                  }) : eventsLoading ? (
                    <p className="mt-4 text-[0.78rem] text-white/30">Loading events…</p>
                  ) : (
                    <p className="mt-4 text-[0.78rem] text-white/20 italic">No events yet.</p>
                  )
                ) : displaySeason ? (
                  <SeasonTimeline
                    season={displaySeason}
                    players={players}
                    items={items}
                    onCharClick={handleCharClick}
                    onItemClick={handleItemClick}
                    onLocClick={handleLocClick}
                  />
                ) : eventsLoading ? (
                  <p className="mt-4 text-[0.78rem] text-white/30">Loading events…</p>
                ) : (
                  <p className="mt-4 text-[0.78rem] text-white/20 italic">No events yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
