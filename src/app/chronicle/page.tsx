"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import EVENT_TYPES from "@/components/story-events/event-types";
import { StoryEvent } from "@/components/story-events/use-story-events";
import SeasonTimeline from "@/components/story-events/season-timeline";
import { buildSeasons, getCurrentSeason } from "@/components/story-events/season-utils";
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

function hostilityColor(h: number): string {
  switch (h) {
    case 1:
      return "#ff5555";
    case 2:
      return "#5588ff";
    case 3:
      return "#ffcc44";
    default:
      return "rgba(255,255,255,0.9)";
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
const GOLD = "#c8923a";
const HEIGHT_FOG_DENSITY = 2.5; // controls how quickly fog thins above sea level

// Orbit constants
const R_MIN = 4,
  R_MAX = 35;
const ELEV_NEAR = Math.PI * (30 / 180); // camera elevation when close (30° from horizontal)
const ELEV_FAR = Math.PI / 2; // camera elevation when far (straight down)

const MAP_EXTENT = 406400; // fixed coordinate bounds — matches heightmap grid ±406400

function sampleHmHeight(data: Uint8ClampedArray, threeX: number, threeZ: number): number {
  const nx = threeX / 20 + 0.5;
  const ny = threeZ / 20 + 0.5;
  const ix = Math.min(511, Math.max(0, Math.round(nx * 511)));
  const iy = Math.min(511, Math.max(0, Math.round(ny * 511)));
  return data[(iy * 512 + ix) * 4] / 255;
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
  const terrainMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const heightFogUniformRef = useRef<{ value: number }>({ value: 1.0 });
  const heightFogDensityRef = useRef<{ value: number }>({ value: HEIGHT_FOG_DENSITY });
  const contrastUniformRef = useRef<{ value: number }>({ value: 1.0 });
  const terrainSeaSpecUniformRef = useRef<{ value: number }>({ value: 0.005 });
  const dispScaleRef = useRef(1);
  const revealAtRef = useRef<number[]>([]); // per-liveLocsRef index reveal threshold
  const hmDataRef = useRef<Uint8ClampedArray | null>(null); // decoded heightmap pixel data
  const locHeightsRef = useRef<number[]>([]); // terrain Y (0-1) per liveLoc index

  // Interaction state
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const pinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const sheetDragActiveRef = useRef(false);
  const sheetDragStartYRef = useRef(0);
  const sheetDraggedRef = useRef(false);
  const sheetExpandedRef = useRef(false);
  const selectedIdxRef = useRef<number | null>(null);
  const sheetElRef = useRef<HTMLDivElement | null>(null);
  const portraitGroupRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [liveLocs, setLiveLocs] = useState<LiveLoc[]>([]);
  const liveLocsRef = useRef<LiveLoc[]>([]);
  const locOverlayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const locRingSvgRefs = useRef<Map<number, SVGSVGElement>>(new Map());
  const locRingCircleRefs = useRef<Map<number, SVGCircleElement>>(new Map());

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [players, setPlayers] = useState<Record<string | number, { name: string }>>({});
  const [items, setItems] = useState<Record<string | number, string>>({});
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setSheetExpanded(false);
  }, [selectedIdx]);

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
    selectedIdxRef.current = selectedIdx;
  }, [selectedIdx]);
  useEffect(() => {
    liveLocsRef.current = liveLocs;
    // Rank by radiusWorld: top 4 locations always visible at R_MAX; rest spread down to R_MIN+2
    const K = 4;
    const sorted = liveLocs.map((l, i) => ({ i, r: l.radiusWorld })).sort((a, b) => a.r - b.r);
    const N = sorted.length;
    const out = new Array(N).fill(R_MIN + 2);
    sorted.forEach(({ i }, rank) => {
      const t = N > K ? Math.min(1, rank / (N - K)) : 1;
      out[i] = R_MIN + 2 + t * (R_MAX - R_MIN - 2);
    });
    revealAtRef.current = out;
    if (hmDataRef.current)
      locHeightsRef.current = liveLocs.map((l) =>
        sampleHmHeight(hmDataRef.current!, l.threeX, l.threeZ),
      );
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

  const currentSeason = getCurrentSeason(buildSeasons(events));
  const seasonEvents = currentSeason ? currentSeason.days.flatMap((d) => d.events) : [];
  const eventLocNames = new Set(seasonEvents.map((e) => e.location).filter(Boolean) as string[]);

  // Per-location top-3 characters by fame within the current season only.
  const locPortraits = useMemo(() => {
    const charToLocIdx = new Map<number, number>();
    for (const ev of seasonEvents) {
      if (!ev.location || ev.primary_char == null) continue;
      if (charToLocIdx.has(ev.primary_char)) continue;
      const locIdx = liveLocs.findIndex((l) => l.name === ev.location);
      if (locIdx !== -1) charToLocIdx.set(ev.primary_char, locIdx);
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
  }, [seasonEvents, players, liveLocs]);

  // Build Three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

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
      color: 0x3c4d52,
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
    seaMatRef.current = seaMat;
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.005;
    sea.renderOrder = 0;
    scene.add(sea);

    scene.add(camera);
    updateCameraFromOrbit(); // set initial position + lookAt from orbit state

    // Animation loop
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
      updateCameraFromOrbit();
      if (debugRef.current) debugRef.current.textContent = `r: ${radiusRef.current.toFixed(2)}`;

      // Portrait overlays: project world positions to screen coords
      if (portraitGroupRefs.current.size > 0 && mount) {
        const portraitOpacity = Math.max(0, Math.min(1, (15 - radiusRef.current) / 3));
        const W = mount.clientWidth;
        const H = mount.clientHeight;
        portraitGroupRefs.current.forEach((el, locIdx) => {
          const liveLoc = liveLocsRef.current[locIdx];
          if (!liveLoc) return;
          const h = locHeightsRef.current[locIdx] ?? 0;
          const pos = new THREE.Vector3(
            liveLoc.threeX,
            h * dispScaleRef.current + 0.08,
            liveLoc.threeZ,
          ).project(camera);
          const sx = ((pos.x + 1) / 2) * W;
          const sy = ((-pos.y + 1) / 2) * H;
          el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
          el.style.opacity = portraitOpacity.toFixed(3);
        });
      }

      // Location overlays: project world positions to screen coords
      if (locOverlayRefs.current.size > 0 && mount) {
        const locW = mount.clientWidth;
        const locH = mount.clientHeight;
        locOverlayRefs.current.forEach((el, i) => {
          const loc = liveLocsRef.current[i];
          if (!loc) return;
          const revealAt = revealAtRef.current[i] ?? R_MAX;
          const locOpacity = Math.max(0, Math.min(1, (revealAt - radiusRef.current) / 3));
          el.style.pointerEvents = locOpacity > 0 ? "auto" : "none";
          const worldY = (locHeightsRef.current[i] ?? 0.5) * dispScaleRef.current + 0.08;
          const pos = new THREE.Vector3(loc.threeX, worldY, loc.threeZ).project(camera);
          if (pos.z > 1) {
            el.style.opacity = "0";
            return;
          }
          const sx = ((pos.x + 1) / 2) * locW;
          const sy = ((-pos.y + 1) / 2) * locH;
          el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
          el.style.opacity = locOpacity.toFixed(3);
          const svg = locRingSvgRefs.current.get(i);
          const circle = locRingCircleRefs.current.get(i);
          if (svg && circle && loc.radiusWorld > 0) {
            const offsetPos = new THREE.Vector3(
              loc.threeX + loc.radiusWorld,
              worldY,
              loc.threeZ,
            ).project(camera);
            const ox = ((offsetPos.x + 1) / 2) * locW;
            const oy = ((-offsetPos.y + 1) / 2) * locH;
            const pr = Math.max(0, Math.sqrt((ox - sx) ** 2 + (oy - sy) ** 2));
            svg.setAttribute("width", String(Math.ceil(pr * 2 + 2)));
            svg.setAttribute("height", String(Math.ceil(pr * 2 + 2)));
            svg.style.left = `${-(pr + 1)}px`;
            svg.style.top = `${-(pr + 1)}px`;
            circle.setAttribute("cx", String(pr + 1));
            circle.setAttribute("cy", String(pr + 1));
            circle.setAttribute("r", String(pr));
          }
        });
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

    // Resize handler
    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth,
        h = mount.clientHeight;
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
  const PAN_LIMIT = 10;
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
    mount.setPointerCapture(e.pointerId);
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

    if (!draggingRef.current) {
      // Tapping empty canvas deselects; location selection is handled by overlay onClick
      setSelectedIdx(null);
    }
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
    const delta = Math.max(!isExpanded ? -150 : 0, Math.min(200, raw));
    const el = sheetElRef.current;
    if (!el) return;
    if (isExpanded) el.style.transform = `translateY(${delta}px)`;
    else el.style.transform = `translateY(calc(100% - 120px + ${delta}px))`;
  }, []);

  const onSheetHandlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!sheetDragActiveRef.current) return;
    sheetDragActiveRef.current = false;
    const delta = e.clientY - sheetDragStartYRef.current;
    const didDrag = sheetDraggedRef.current;
    const isExpanded = sheetExpandedRef.current;
    const hasLoc = selectedIdxRef.current !== null;

    let newExpanded = isExpanded;
    if (didDrag) {
      if (!isExpanded && delta < -30) newExpanded = true;
      else if (isExpanded && delta > 30) newExpanded = false;
    }

    const el = sheetElRef.current;
    if (el) {
      el.style.transition = "transform 0.3s ease";
      if (newExpanded) el.style.transform = "translateY(0px)";
      else el.style.transform = "translateY(calc(100% - 120px))";
    }

    if (newExpanded !== isExpanded) setSheetExpanded(newExpanded);
  }, []);

  const onSheetHandlePointerCancel = useCallback(() => {
    if (!sheetDragActiveRef.current) return;
    sheetDragActiveRef.current = false;
    sheetDraggedRef.current = false;
    const isExpanded = sheetExpandedRef.current;
    const el = sheetElRef.current;
    if (el) {
      el.style.transition = "transform 0.3s ease";
      if (isExpanded) el.style.transform = "translateY(0px)";
      else el.style.transform = "translateY(calc(100% - 120px))";
    }
  }, []);

  const selectedLoc: LiveLoc | null = selectedIdx !== null ? (liveLocs[selectedIdx] ?? null) : null;
  const locEvents = selectedLoc && currentSeason
    ? currentSeason.days.flatMap((d) => d.events).filter((e) => e.location === selectedLoc.name)
    : [];

  // When a location is selected, filter the season's day events to that location only
  const displaySeason = useMemo(() => {
    if (!currentSeason || !selectedLoc) return currentSeason;
    return {
      ...currentSeason,
      contextEvent: undefined,
      summaryEvent: undefined,
      days: currentSeason.days.map((day) => ({
        ...day,
        events: day.events.filter((e) => e.location === selectedLoc.name),
      })),
    };
  }, [currentSeason, selectedLoc]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0c0e]">
      {/* Three.js mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 cursor-grab touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
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
              filter: "drop-shadow(0 0 6px rgba(0, 0, 0, 1))",
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
              setSelectedIdx(i);
              focusTargetRef.current = new THREE.Vector3(
                Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeX)),
                (locHeightsRef.current[i] ?? 0) * dispScaleRef.current,
                Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, loc.threeZ)),
              );
              targetRadiusRef.current = Math.max(R_MIN, Math.min(R_MAX, loc.radiusWorld * 10));
            }}
          >
            {/* Radius ring */}
            {selectedIdx === i && (
              <svg
                ref={(el) => {
                  if (el) locRingSvgRefs.current.set(i, el);
                  else locRingSvgRefs.current.delete(i);
                }}
                className="pointer-events-none absolute"
                width="0"
                height="0"
              >
                <circle
                  ref={(el) => {
                    if (el) locRingCircleRefs.current.set(i, el);
                    else locRingCircleRefs.current.delete(i);
                  }}
                  cx="0"
                  cy="0"
                  r="0"
                  fill="none"
                  stroke="#fff3"
                  strokeWidth="2"
                />
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
                  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))",
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
              <div className="mt-1 min-w-[180px] rounded-md border border-white/8 bg-[rgba(6,8,10,0.93)] px-3 py-2.5 backdrop-blur">
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

      {/* Header overlay */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-6 pt-5 pb-4">
        <div className="mt-2 text-[0.72rem] tracking-[0.05em] text-white/30">
          {eventsLoading
            ? "Loading events…"
            : `${seasonEvents.length} events · ${eventLocNames.size} locations visited`}
        </div>
      </div>

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
        <div className="absolute top-0 right-0 bottom-0 z-20 w-[min(340px,90vw)] overflow-y-auto border-l border-white/7 bg-[rgba(6,8,10,0.92)] px-4 pt-20 pb-8 backdrop-blur-lg">
          {selectedLoc && (
            <>
              <button
                onClick={() => setSelectedIdx(null)}
                className="absolute top-5 right-5 cursor-pointer border-none bg-transparent px-2 py-1 text-[1.2rem] leading-none text-white/35"
                aria-label="Close"
              >
                ×
              </button>
              <div
                className="font-heading mb-1 text-[1.1rem] leading-[1.3] tracking-[0.15em] uppercase"
                style={{
                  color: eventLocNames.has(selectedLoc.name) ? "var(--gold)" : "rgba(255,255,255,0.85)",
                  textShadow: eventLocNames.has(selectedLoc.name) ? `${GOLD} 0 0 8px` : "none",
                }}
              >
                {selectedLoc.name}
              </div>
              {selectedLoc.description && (
                <p className="mb-3 text-[0.78rem] leading-snug text-white/45">
                  {selectedLoc.description}
                </p>
              )}
              <div className="mb-4 text-[0.62rem] tracking-[0.1em] text-white/25 uppercase">
                {locEvents.length} event{locEvents.length !== 1 ? "s" : ""} at this location
              </div>
              <div className="mb-2 h-px bg-white/6" />
            </>
          )}
          {displaySeason ? (
            <SeasonTimeline season={displaySeason} players={players} items={items} />
          ) : eventsLoading ? (
            <p className="mt-4 text-[0.78rem] text-white/30">Loading events…</p>
          ) : (
            <p className="mt-4 text-[0.78rem] text-white/20 italic">No events yet.</p>
          )}
        </div>
      )}

      {/* Mobile bottom sheet — season timeline, always draggable */}
      {isMobile && (
        <div
          ref={sheetElRef}
          className="fixed right-0 bottom-0 left-0 z-20 flex h-[80vh] flex-col overflow-hidden rounded-t-2xl bg-[rgba(6,8,10,0.96)] backdrop-blur-lg"
          style={{
            transform: sheetExpanded ? "translateY(0px)" : "translateY(calc(100% - 120px))",
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

          {/* Peek header */}
          <div
            className="flex shrink-0 items-center justify-between px-5 pt-1 pb-3"
            style={{ cursor: sheetExpanded ? "default" : "pointer" }}
            onClick={() => !sheetDraggedRef.current && !sheetExpanded && setSheetExpanded(true)}
          >
            {selectedLoc ? (
              <div
                className="font-heading text-[1rem] leading-[1.3] tracking-[0.15em] uppercase"
                style={{
                  color: eventLocNames.has(selectedLoc.name) ? "var(--gold)" : "rgba(255,255,255,0.85)",
                  textShadow: eventLocNames.has(selectedLoc.name) ? `${GOLD} 0 0 8px` : "none",
                }}
              >
                {selectedLoc.name}
              </div>
            ) : currentSeason ? (
              <div className="font-heading text-[0.9rem] tracking-[0.15em] uppercase text-white/60">
                Season {currentSeason.number}
              </div>
            ) : (
              <div className="text-[0.8rem] text-white/30">Story Events</div>
            )}
            {selectedLoc && (
              <button
                onClick={(ev) => { ev.stopPropagation(); setSelectedIdx(null); }}
                className="shrink-0 cursor-pointer border-none bg-transparent py-1 pr-1 pl-4 text-[1.2rem] leading-none text-white/35"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>

          {/* Expanded content */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-8"
            style={{ opacity: sheetExpanded ? 1 : 0, transition: "opacity 0.15s ease" }}
          >
            {selectedLoc && (
              <>
                {selectedLoc.description && (
                  <p className="mb-2 text-[0.78rem] text-white/45">{selectedLoc.description}</p>
                )}
                <div className="mb-4 text-[0.62rem] tracking-[0.1em] text-white/25 uppercase">
                  {locEvents.length} event{locEvents.length !== 1 ? "s" : ""} at this location
                </div>
                <div className="mb-2 h-px bg-white/6" />
              </>
            )}
            {displaySeason ? (
              <SeasonTimeline season={displaySeason} players={players} items={items} />
            ) : eventsLoading ? (
              <p className="mt-4 text-[0.78rem] text-white/30">Loading events…</p>
            ) : (
              <p className="mt-4 text-[0.78rem] text-white/20 italic">No events yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
