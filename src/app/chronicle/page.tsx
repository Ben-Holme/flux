"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LOCATIONS from "@/data/locations.json";
import EVENT_TYPES from "@/components/story-events/event-types";
import { StoryEvent } from "@/components/story-events/use-story-events";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface Location {
  name: string;
  description: string;
  keywords: string;
  x: string;
  y: string;
  z: string;
}

const locations = LOCATIONS as Location[];
const GOLD = "#c8923a";
const GOLD_NUM = 0xc8923a;
const HEIGHT_FOG_DENSITY = 2.5; // controls how quickly fog thins above sea level

// Orbit constants
const R_MIN = 4,
  R_MAX = 35;
const ELEV_NEAR = Math.PI * (10 / 180); // camera elevation when close (10° from horizontal)
const ELEV_FAR = Math.PI / 2; // camera elevation when far (straight down)

const MAP_EXTENT = 406400; // fixed coordinate bounds — matches heightmap grid ±406400

function normalize(l: Location) {
  return {
    nx: (parseFloat(l.x) / MAP_EXTENT + 1) / 2,
    ny: (parseFloat(l.y) / MAP_EXTENT + 1) / 2,
  };
}

export default function ChroniclePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0)); // orbit pivot on terrain
  const radiusRef = useRef(15); // orbit radius (camera → target distance)
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
  const spriteHeightsRef = useRef<number[]>([]);

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

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [players, setPlayers] = useState<Record<string | number, { name: string }>>({});
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
  const [seaSpec, setSeaSpec] = useState(0.01);
  const [terrainNormal, setTerrainNormal] = useState(0.6);
  const [heightScale, setHeightScale] = useState(1);
  const [contrast, setContrast] = useState(1.5);
  const dbgRef = useRef(dbg); // mutable mirror — read by animate loop without triggering renders

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
    dispScaleRef.current = heightScale;
    if (terrainMatRef.current) terrainMatRef.current.displacementScale = heightScale;
    heightFogDensityRef.current.value =
      heightScale > 0 ? HEIGHT_FOG_DENSITY / heightScale : HEIGHT_FOG_DENSITY;
    spritesRef.current.forEach((sprite) => {
      const idx = (sprite as THREE.Sprite & { locIdx: number }).locIdx;
      const h = spriteHeightsRef.current[idx] ?? 0.5;
      sprite.position.setY(h * heightScale + 0.08);
    });
  }, [heightScale]);

  useEffect(() => { sheetExpandedRef.current = sheetExpanded; }, [sheetExpanded]);
  useEffect(() => { selectedIdxRef.current = selectedIdx; }, [selectedIdx]);

  const eventLocNames = new Set(events.map((e) => e.location).filter(Boolean) as string[]);

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
    scene.background = new THREE.Color(0x2a3d3e);
    // Atmospheric fog — density driven by zoom in animate loop; set before first render so shaders compile with USE_FOG
    scene.fog = new THREE.FogExp2(0x2a3d3e, 0);
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
      displacementScale: 2,
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
      specular: new THREE.Color(0.01, 0.01, 0.01),
      shininess: 750,
      normalMap: seaNormalTexture,
      normalScale: new THREE.Vector2(0.8, 0.8),
      transparent: true,
      depthWrite: false,
    });
    seaMat.onBeforeCompile = (shader) => {
      shader.vertexShader =
        `varying float vDiscDist;\n` +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        vDiscDist = length(position.xy) / 25.0;`,
        );
      shader.fragmentShader =
        `varying float vDiscDist;\n` +
        shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
        float fade = smoothstep(0.7, 1.0, vDiscDist);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.0), fade);
        gl_FragColor.a *= 1.0 - smoothstep(0.96, 1.0, vDiscDist);`,
        );
    };
    seaMatRef.current = seaMat;
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.005;
    sea.renderOrder = 0;
    scene.add(sea);

    // Sprite material for location dots
    function makeSpriteMaterial(hasEvent: boolean, color: number) {
      const sc = document.createElement("canvas");
      sc.width = 64;
      sc.height = 64;
      const sctx = sc.getContext("2d")!;
      sctx.clearRect(0, 0, 64, 64);
      const r = hasEvent ? 10 : 7;
      const hex = "#" + color.toString(16).padStart(6, "0");
      if (hasEvent) {
        const grd = sctx.createRadialGradient(32, 32, 0, 32, 32, 20);
        grd.addColorStop(0, hex);
        grd.addColorStop(0.5, hex);
        grd.addColorStop(1, "transparent");
        sctx.fillStyle = grd;
        sctx.beginPath();
        sctx.arc(32, 32, 20, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.fillStyle = hex;
      sctx.beginPath();
      sctx.arc(32, 32, r, 0, Math.PI * 2);
      sctx.fill();
      return new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(sc),
        depthTest: false,
        transparent: true,
      });
    }

    // Place sprites
    const half = terrainSize / 2;
    const dispScale = dispScaleRef.current;
    const sprites: THREE.Sprite[] = [];

    locations.forEach((loc) => {
      const { nx, ny } = normalize(loc);
      const hasEvent = eventLocNames.has(loc.name);
      const color = hasEvent ? GOLD_NUM : 0x888888;
      const mat2 = makeSpriteMaterial(hasEvent, color);
      const sprite = new THREE.Sprite(mat2);
      sprite.renderOrder = 1;
      sprite.scale.set(hasEvent ? 0.22 : 0.16, hasEvent ? 0.22 : 0.16, 1);

      // World position on terrain — place at mid-height until PNG decodes
      const wx = (nx - 0.5) * terrainSize;
      const wz = (ny - 0.5) * terrainSize;
      sprite.position.set(wx, dispScale * 0.5 + 0.08, wz);
      (sprite as THREE.Sprite & { locIdx: number }).locIdx = locations.indexOf(loc);

      scene.add(sprite);
      sprites.push(sprite);
    });
    spritesRef.current = sprites;

    // Async: decode heightmap PNG pixels and reposition sprites on real terrain elevation
    const hmDecodeCanvas = document.createElement("canvas");
    hmDecodeCanvas.width = 512;
    hmDecodeCanvas.height = 512;
    const hmDecodeCtx = hmDecodeCanvas.getContext("2d")!;
    const hmDecodeImg = new Image();
    hmDecodeImg.onload = () => {
      hmDecodeCtx.drawImage(hmDecodeImg, 0, 0, 512, 512);
      const px = hmDecodeCtx.getImageData(0, 0, 512, 512);
      function heightAt(nx: number, ny: number) {
        const ix = Math.min(511, Math.max(0, Math.round(nx * 511)));
        const iy = Math.min(511, Math.max(0, Math.round(ny * 511)));
        return px.data[(iy * 512 + ix) * 4] / 255;
      }
      const heights: number[] = new Array(locations.length).fill(0.5);
      sprites.forEach((sprite) => {
        const idx = (sprite as THREE.Sprite & { locIdx: number }).locIdx;
        const loc = locations[idx];
        const { nx, ny } = normalize(loc);
        const wx = (nx - 0.5) * terrainSize;
        const wz = (ny - 0.5) * terrainSize;
        const h = heightAt(nx, ny);
        heights[idx] = h;
        sprite.position.set(wx, h * dispScaleRef.current + 0.08, wz);
      });
      spriteHeightsRef.current = heights;
    };
    hmDecodeImg.src = "/heightmap.png";

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
      updateCameraFromOrbit();
      if (debugRef.current) debugRef.current.textContent = `r: ${radiusRef.current.toFixed(2)}`;

      // Fog only ramps in the closest 10% of the zoom range
      const FOG_THRESHOLD = R_MIN + 0.3 * (R_MAX - R_MIN); // 13.3
      const fogT = Math.max(0, Math.min(1, (FOG_THRESHOLD - radiusRef.current) / (FOG_THRESHOLD - R_MIN)));
      (scene.fog as THREE.FogExp2).density = fogT * 0.2;

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

  // Update sprite appearances when eventLocNames changes (after events load)
  useEffect(() => {
    spritesRef.current.forEach((sprite) => {
      const idx = (sprite as THREE.Sprite & { locIdx: number }).locIdx;
      const loc = locations[idx];
      const hasEvent = eventLocNames.has(loc.name);
      const mat = sprite.material as THREE.SpriteMaterial;
      const sc = document.createElement("canvas");
      sc.width = 64;
      sc.height = 64;
      const sctx = sc.getContext("2d")!;
      sctx.clearRect(0, 0, 64, 64);
      const color = hasEvent ? GOLD : "rgba(136,136,136,1)";
      const r = hasEvent ? 10 : 7;
      if (hasEvent) {
        const grd = sctx.createRadialGradient(32, 32, 0, 32, 32, 20);
        grd.addColorStop(0, color);
        grd.addColorStop(0.5, color);
        grd.addColorStop(1, "transparent");
        sctx.fillStyle = grd;
        sctx.beginPath();
        sctx.arc(32, 32, 20, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.fillStyle = color;
      sctx.beginPath();
      sctx.arc(32, 32, r, 0, Math.PI * 2);
      sctx.fill();
      mat.map?.dispose();
      mat.map = new THREE.CanvasTexture(sc);
      mat.needsUpdate = true;
      sprite.scale.set(hasEvent ? 0.22 : 0.16, hasEvent ? 0.22 : 0.16, 1);
    });
  }, [eventLocNames]);

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
    const step = Math.max(0.5, radiusRef.current) * 0.01334;
    radiusRef.current = Math.min(
      R_MAX,
      Math.max(R_MIN, radiusRef.current + (factor < 1 ? -step : step)),
    );
  }

  // Raycasting for location selection
  function pickLocation(clientX: number, clientY: number): number | null {
    const mount = mountRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!mount || !camera || !scene) return null;
    const rect = mount.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    // Test against sprites with a wider threshold
    raycaster.params.Points = { threshold: 0.3 };
    const hits = raycaster.intersectObjects(spritesRef.current);
    if (hits.length === 0) return null;
    const sprite = hits[0].object as THREE.Sprite & { locIdx: number };
    return sprite.locIdx ?? null;
  }

  // Wheel zoom
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 0.92 : 1.08;
      zoomCamera(dir);
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
        if (lastPinchDistRef.current > 0) zoomCamera(lastPinchDistRef.current / newDist);
        // Pan from midpoint delta
        panCamera(newMid.x - prevMid.x, newMid.y - prevMid.y);
      }
      lastPinchDistRef.current = newDist;
      pinchMidRef.current = newMid;
      return;
    }

    if (draggingRef.current) {
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

    // Cursor: pointer when hovering a sprite
    const hit = pickLocation(e.clientX, e.clientY);
    mount.style.cursor = hit !== null ? "pointer" : "grab";
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
      const idx = pickLocation(e.clientX, e.clientY);
      setSelectedIdx(idx);
      if (idx !== null) {
        const loc = locations[idx];
        const { nx, ny } = normalize(loc);
        focusTargetRef.current = new THREE.Vector3(
          Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, (nx - 0.5) * 20)),
          0,
          Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, (ny - 0.5) * 20)),
        );
      }
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
    const hasLoc = selectedIdxRef.current !== null;
    const delta = Math.max(hasLoc && !isExpanded ? -150 : 0, Math.min(200, raw));
    const el = sheetElRef.current;
    if (!el) return;
    if (!hasLoc) el.style.transform = `translateY(calc(100% - 44px + ${delta}px))`;
    else if (isExpanded) el.style.transform = `translateY(${delta}px)`;
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
    if (didDrag && hasLoc) {
      if (!isExpanded && delta < -30) newExpanded = true;
      else if (isExpanded && delta > 30) newExpanded = false;
    }

    const el = sheetElRef.current;
    if (el) {
      el.style.transition = "transform 0.3s ease";
      if (!hasLoc) el.style.transform = "translateY(calc(100% - 44px))";
      else if (newExpanded) el.style.transform = "translateY(0px)";
      else el.style.transform = "translateY(calc(100% - 120px))";
    }

    if (newExpanded !== isExpanded) setSheetExpanded(newExpanded);
  }, []);

  const onSheetHandlePointerCancel = useCallback(() => {
    if (!sheetDragActiveRef.current) return;
    sheetDragActiveRef.current = false;
    sheetDraggedRef.current = false;
    const isExpanded = sheetExpandedRef.current;
    const hasLoc = selectedIdxRef.current !== null;
    const el = sheetElRef.current;
    if (el) {
      el.style.transition = "transform 0.3s ease";
      if (!hasLoc) el.style.transform = "translateY(calc(100% - 44px))";
      else if (isExpanded) el.style.transform = "translateY(0px)";
      else el.style.transform = "translateY(calc(100% - 120px))";
    }
  }, []);

  const selectedLoc = selectedIdx !== null ? locations[selectedIdx] : null;
  const locEvents = selectedLoc ? events.filter((e) => e.location === selectedLoc.name) : [];

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0a0c0e",
      }}
    >
      {/* Three.js mount */}
      <div
        ref={mountRef}
        style={{ position: "absolute", inset: 0, cursor: "grab", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      {/* Debug overlay */}
      <div
        ref={debugRef}
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          zIndex: 30,
          fontFamily: "monospace",
          fontSize: "11px",
          color: "rgba(255,255,255,0.5)",
          pointerEvents: "none",
        }}
      />

      {/* Debug panel */}
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 30, userSelect: "none" }}>
        <button
          onClick={() => setDbgOpen((o) => !o)}
          style={{
            display: "block",
            marginLeft: "auto",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.75rem",
            cursor: "pointer",
            borderRadius: "4px",
            padding: "3px 8px",
            fontFamily: "monospace",
          }}
        >
          ⚙
        </button>
        {dbgOpen &&
          (() => {
            const row = (key: keyof typeof dbg, label: string, extra?: (v: boolean) => void) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 3,
                  cursor: "pointer",
                }}
              >
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
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                  }}
                >
                  {label}
                </span>
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
              <label style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 5 }}>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                  }}
                >
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
                  style={{ width: "100%", accentColor: GOLD, cursor: "pointer" }}
                />
              </label>
            );
            return (
              <div
                style={{
                  marginTop: 4,
                  background: "rgba(6,8,10,0.93)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  minWidth: 180,
                }}
              >
                <div
                  style={{
                    fontSize: "0.58rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: 6,
                  }}
                >
                  Lights
                </div>
                {row("ambient", "Ambient")}
                {row("dirLight", "Dir light")}
                {row("fillLight", "Fill light")}
                {row("leftLight", "Left light")}
                <div
                  style={{
                    fontSize: "0.58rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    margin: "8px 0 6px",
                  }}
                >
                  Dir light pos
                </div>
                {sliderRow("Y", dirLightY, 0, 50, 1, setDirLightY)}
                {sliderRow("Z", dirLightZ, -50, 50, 1, setDirLightZ)}
                <div
                  style={{
                    fontSize: "0.58rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    margin: "8px 0 6px",
                  }}
                >
                  Terrain
                </div>
                {sliderRow("Normals", terrainNormal, 0, 3, 0.05, setTerrainNormal)}
                {sliderRow("Height scale", heightScale, 0, 5, 0.1, setHeightScale)}
                {sliderRow("Contrast", contrast, 0.5, 4, 0.05, setContrast)}
                <div
                  style={{
                    fontSize: "0.58rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    margin: "8px 0 6px",
                  }}
                >
                  Sea
                </div>
                {sliderRow("Specular", seaSpec, 0, 0.2, 0.005, setSeaSpec)}
                <div
                  style={{
                    fontSize: "0.58rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    margin: "8px 0 6px",
                  }}
                >
                  Effects
                </div>
                {row("heightFog", "Height fog")}
              </div>
            );
          })()}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Header overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "20px 24px 16px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--gold)",
            textShadow: `${GOLD} 0px 0px 6px, ${GOLD} 0px 0px 12px`,
          }}
        >
          Unyha
        </div>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.85)",
            marginTop: "2px",
          }}
        >
          Chronicle Map
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.05em",
          }}
        >
          {eventsLoading
            ? "Loading events…"
            : `${events.length} events · ${eventLocNames.size} locations visited`}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--gold)",
              display: "inline-block",
              boxShadow: `0 0 6px ${GOLD}`,
            }}
          />
          <span
            style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}
          >
            Has events
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(136,136,136,0.8)",
              display: "inline-block",
            }}
          />
          <span
            style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}
          >
            Location
          </span>
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "0.62rem",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.04em",
          }}
        >
          Scroll / pinch to zoom · drag to pan
        </div>
      </div>

      {/* Desktop side panel */}
      {!isMobile && selectedLoc && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(340px, 90vw)",
            background: "rgba(6,8,10,0.92)",
            backdropFilter: "blur(16px)",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            zIndex: 20,
            overflowY: "auto",
            padding: "80px 24px 32px",
          }}
        >
          <button
            onClick={() => setSelectedIdx(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              fontSize: "1.2rem",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px 8px",
            }}
            aria-label="Close"
          >
            ×
          </button>

          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: eventLocNames.has(selectedLoc.name) ? "var(--gold)" : "rgba(255,255,255,0.85)",
              textShadow: eventLocNames.has(selectedLoc.name) ? `${GOLD} 0 0 8px` : "none",
              lineHeight: 1.3,
              marginBottom: "10px",
            }}
          >
            {selectedLoc.name}
          </div>

          {selectedLoc.description && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6,
                margin: "0 0 12px",
              }}
            >
              {selectedLoc.description}
            </p>
          )}
          {selectedLoc.keywords && (
            <p
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.3)",
                lineHeight: 1.5,
                margin: "0 0 20px",
                fontStyle: "italic",
              }}
            >
              {selectedLoc.keywords}
            </p>
          )}

          {locEvents.length > 0 && (
            <>
              <div
                style={{
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "10px",
                }}
              >
                {locEvents.length} event{locEvents.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {locEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type] ?? {
                    label: ev.type,
                    symbol: "·",
                    color: "rgba(255,255,255,0.4)",
                  };
                  const charName = players[ev.primary_char]?.name ?? `#${ev.primary_char}`;
                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{ color: et.color, fontSize: "0.78rem", letterSpacing: "0.06em" }}
                        >
                          {et.symbol} {et.label}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>
                          {ev.date}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>
                        {charName}
                      </div>
                      {ev.special && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.4)",
                            marginTop: "4px",
                            fontStyle: "italic",
                          }}
                        >
                          {ev.special}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {locEvents.length === 0 && !eventsLoading && (
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
              No recorded events at this location.
            </p>
          )}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && (
        <div
          ref={sheetElRef}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50vh",
            background: "rgba(6,8,10,0.96)",
            backdropFilter: "blur(16px)",
            borderRadius: "16px 16px 0 0",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transform: !selectedLoc
              ? "translateY(calc(100% - 44px))"
              : sheetExpanded
                ? "translateY(0px)"
                : "translateY(calc(100% - 120px))",
            transition: "transform 0.3s ease",
          }}
        >
          {/* Drag handle — tap or drag up to expand */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 8px",
              cursor: "pointer",
              flexShrink: 0,
              touchAction: "none",
            }}
            onPointerDown={onSheetHandlePointerDown}
            onPointerMove={onSheetHandlePointerMove}
            onPointerUp={onSheetHandlePointerUp}
            onPointerCancel={onSheetHandlePointerCancel}
            onClick={() => !sheetDraggedRef.current && selectedLoc && setSheetExpanded(true)}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.25)",
              }}
            />
          </div>

          {selectedLoc && (
            <>
              {/* Peek header: location name + close — always visible in peek */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 20px 12px",
                  flexShrink: 0,
                  cursor: sheetExpanded ? "default" : "pointer",
                }}
                onClick={() => !sheetDraggedRef.current && !sheetExpanded && setSheetExpanded(true)}
              >
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: eventLocNames.has(selectedLoc.name)
                      ? "var(--gold)"
                      : "rgba(255,255,255,0.85)",
                    textShadow: eventLocNames.has(selectedLoc.name) ? `${GOLD} 0 0 8px` : "none",
                    lineHeight: 1.3,
                  }}
                >
                  {selectedLoc.name}
                </div>
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedIdx(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "4px 4px 4px 16px",
                    flexShrink: 0,
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Expanded content — scrollable */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "0 20px 24px",
                  opacity: sheetExpanded ? 1 : 0,
                  transition: "opacity 0.15s ease",
                }}
              >
                {selectedLoc.description && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.6,
                      margin: "0 0 12px",
                    }}
                  >
                    {selectedLoc.description}
                  </p>
                )}
                {selectedLoc.keywords && (
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.3)",
                      lineHeight: 1.5,
                      margin: "0 0 20px",
                      fontStyle: "italic",
                    }}
                  >
                    {selectedLoc.keywords}
                  </p>
                )}
                {locEvents.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.3)",
                        marginBottom: "10px",
                      }}
                    >
                      {locEvents.length} event{locEvents.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {locEvents.map((ev, i) => {
                        const et = EVENT_TYPES[ev.type] ?? {
                          label: ev.type,
                          symbol: "·",
                          color: "rgba(255,255,255,0.4)",
                        };
                        const charName = players[ev.primary_char]?.name ?? `#${ev.primary_char}`;
                        return (
                          <div
                            key={i}
                            style={{
                              borderRadius: "4px",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              padding: "10px 12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: et.color,
                                  fontSize: "0.78rem",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {et.symbol} {et.label}
                              </span>
                              <span
                                style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}
                              >
                                {ev.date}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>
                              {charName}
                            </div>
                            {ev.special && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "rgba(255,255,255,0.4)",
                                  marginTop: "4px",
                                  fontStyle: "italic",
                                }}
                              >
                                {ev.special}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {locEvents.length === 0 && !eventsLoading && (
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.2)",
                      fontStyle: "italic",
                    }}
                  >
                    No recorded events at this location.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
