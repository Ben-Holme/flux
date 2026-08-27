"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { cn } from "@/lib/cn";

// Non-interactive, fixed-camera render of the Unyha world map. The scene (terrain,
// height-fog shader, specular sea, cloud layer, lighting) is ported from the
// interactive map in src/app/chronicle/page.tsx. Interactivity (pan/zoom/rotate,
// location overlays, live API data) is intentionally omitted for this use case.

// Orbit / framing constants (match chronicle)
const R_MIN = 1;
const R_MAX = 35;
const ELEV_NEAR = Math.PI * (30 / 180); // camera elevation when close
const ELEV_FAR = Math.PI / 2; // camera elevation when far (straight down)
const HEIGHT_FOG_DENSITY = 2.5;

// Scene tuning defaults (match chronicle's initial values)
const HEIGHT_SCALE = 1.8; // terrain displacement scale
const TERRAIN_NORMAL = 0.6;
const SEA_SPEC = 0.065;
const MAP_SCALE = 1.015; // color/spec texture repeat (slight inset)
const FOG_NEAR = R_MIN + 0.9 * (R_MAX - R_MIN);
// Cursor light travels on a horizontal plane just above the tallest peak
// (peak height ≈ HEIGHT_SCALE, clouds sit at y = 5.7).
const LIGHT_PLANE_Y = HEIGHT_SCALE + 1.2;
// Game world coordinates map to the 20×20 scene: threeX = x / MAP_EXTENT * 10.
const MAP_EXTENT = 406400;

type MarkerKind = "city" | "orc" | "dungeon" | "mountain";

export interface WorldMapMarker {
  name: string;
  /** Game-world X (east). */
  x: number;
  /** Game-world Y (north is negative). */
  y: number;
  kind?: MarkerKind;
}

const MARKER_ICON: Record<MarkerKind, string> = {
  city: "/unyha-icons/Town.svg",
  orc: "/unyha-icons/orc.svg",
  dungeon: "/unyha-icons/dungeon.svg",
  mountain: "/unyha-icons/Mountain.svg",
};

const MARKER_COLOR: Record<MarkerKind, string> = {
  city: "#ffffff",
  orc: "#ffffff",
  dungeon: "#ffcc44",
  mountain: "#cbd5e1",
};

function buildCloudTexture(): THREE.DataTexture {
  const S = 512;
  const data = new Uint8ClampedArray(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    data[i * 4] = 255;
    data[i * 4 + 1] = 255;
    data[i * 4 + 2] = 255;
  }

  let seed = 99991;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  };

  const addPuff = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    cos: number,
    sin: number,
    maxA: number,
  ) => {
    const r = Math.max(rx, ry);
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(S - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(S - 1, Math.ceil(cy + r));
    const contrib = Math.round(maxA * 255);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx,
          dy = y - cy;
        const lx = dx * cos + dy * sin;
        const ly = -dx * sin + dy * cos;
        const t = (lx / rx) ** 2 + (ly / ry) ** 2;
        if (t >= 1) continue;
        const idx = (y * S + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] += Math.round(contrib * (1 - t));
      }
    }
  };

  for (let k = 0; k < 70; k++) {
    const cx = rnd() * S,
      cy = rnd() * S;
    const rx = 35 + rnd() * 90;
    const ry = rx * (0.3 + rnd() * 0.35);
    const angle = rnd() * Math.PI;
    addPuff(cx, cy, rx, ry, Math.cos(angle), Math.sin(angle), 0.04 + rnd() * 0.11);
  }
  for (let k = 0; k < 140; k++) {
    const cx = rnd() * S,
      cy = rnd() * S;
    const r = 6 + rnd() * 27;
    addPuff(cx, cy, r, r, 1, 0, 0.03 + rnd() * 0.09);
  }

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
  blurAlpha(8);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (x / (S - 1)) * 2 - 1;
      const ny = (y / (S - 1)) * 2 - 1;
      const edge = Math.sqrt(nx * nx + ny * ny);
      const u = Math.min(1, Math.max(0, (edge - 0.52) / 0.28));
      const fade = 1 - u * u * (3 - 2 * u);
      const idx = (y * S + x) * 4;
      data[idx + 3] = Math.round(data[idx + 3] * fade);
    }
  }

  const tex = new THREE.DataTexture(new Uint8Array(data.buffer), S, S, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

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

interface WorldMapProps {
  /** Orbit target X in scene units (world spans [-10, 10]; +X = east). */
  targetX?: number;
  /** Orbit target Z in scene units (world spans [-10, 10]; -Z = north). */
  targetZ?: number;
  /** Camera distance from target; larger = more zoomed out / top-down. */
  radius?: number;
  /**
   * Explicit free camera transform. Overrides targetX/targetZ/radius framing.
   * Paste the value produced by the debug overlay's "Copy camera" button here.
   */
  view?: { position: [number, number, number]; target: [number, number, number] };
  /** Alternative camera for viewports narrower than 768 px. Falls back to `view` if omitted. */
  mobileView?: { position: [number, number, number]; target: [number, number, number] };
  /** Location markers (icon + label) drawn over the map, like the interactive map. */
  markers?: WorldMapMarker[];
  /** Show the drifting cloud sheet above the terrain. Defaults to true. */
  clouds?: boolean;
  /** Overall lighting multiplier for the map. 1 = default; >1 brightens. */
  brightness?: number;
  /** Enable drag-to-orbit + scroll-to-pan controls plus a copyable camera readout. */
  debug?: boolean;
  className?: string;
}

/**
 * Static, non-interactive Unyha world map. Defaults frame the north-eastern
 * quadrant (+X east, -Z north). Pass `debug` to tune a camera and copy its transform.
 */
export function WorldMap({
  targetX = 4,
  targetZ = -4,
  radius = 15,
  view,
  mobileView,
  markers = [],
  clouds = true,
  brightness = 1,
  debug = false,
  className,
}: WorldMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const snippetRef = useRef("");
  const viewRef = useRef(view);
  viewRef.current = view;
  const mobileViewRef = useRef(mobileView);
  mobileViewRef.current = mobileView;
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const markerElsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleCopy = () => {
    if (snippetRef.current) navigator.clipboard?.writeText(snippetRef.current);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = Math.max(1, mount.clientWidth);
    const H = Math.max(1, mount.clientHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0d0f, 0);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    let needsRender = true;
    const requestRender = () => {
      needsRender = true;
    };

    // Lighting (scaled by the brightness prop)
    scene.add(new THREE.AmbientLight(0xffffff, 0.13 * brightness));
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2 * brightness);
    dirLight.position.set(0, 45, -25);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x4466aa, 1.5 * brightness);
    fillLight.position.set(0, 45, 25);
    scene.add(fillLight);
    const leftLight = new THREE.DirectionalLight(0xfff8f0, 1.2 * brightness);
    leftLight.position.set(-8, 8, 0);
    leftLight.castShadow = true;
    scene.add(leftLight);

    // Shader uniforms (fixed for a static view)
    const heightFogUniform = { value: 1.0 };
    const heightFogDensityUniform = { value: HEIGHT_FOG_DENSITY / HEIGHT_SCALE };
    const contrastUniform = { value: 1.0 };
    const seaSpecUniform = { value: 0.005 };

    // Terrain
    const dispTexture = new THREE.TextureLoader().load("/heightmap.png", requestRender);
    const terrainSize = 20;
    const segments = 256;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);

    const mapOffset = (1 - MAP_SCALE) / 2;
    const colorTexture = new THREE.TextureLoader().load("/worldMap.jpg", requestRender);
    colorTexture.wrapS = colorTexture.wrapT = THREE.ClampToEdgeWrapping;
    colorTexture.repeat.set(MAP_SCALE, MAP_SCALE);
    colorTexture.offset.set(mapOffset, mapOffset);

    const normalTexture = new THREE.TextureLoader().load("/normalmap.png", requestRender);
    const specTexture = new THREE.TextureLoader().load("/specmap.png", requestRender);
    specTexture.wrapS = specTexture.wrapT = THREE.ClampToEdgeWrapping;
    specTexture.repeat.set(MAP_SCALE, MAP_SCALE);
    specTexture.offset.set(mapOffset, mapOffset);

    const seaNormalTexture = buildSeaNormalMap();

    const mat = new THREE.MeshStandardMaterial({
      map: colorTexture,
      displacementMap: dispTexture,
      displacementScale: HEIGHT_SCALE,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(TERRAIN_NORMAL, TERRAIN_NORMAL),
      roughness: 0.85,
      metalness: 0.05,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeightFogEnabled = heightFogUniform;
      shader.uniforms.uHeightFogDensity = heightFogDensityUniform;
      shader.uniforms.uContrast = contrastUniform;
      shader.uniforms.uSpecMask = { value: specTexture };
      shader.uniforms.uSeaNormalMap = { value: seaNormalTexture };
      shader.uniforms.uSeaNormalScale = { value: new THREE.Vector2(0.8, 0.8) };
      shader.uniforms.uSeaNormalTiling = { value: new THREE.Vector2(32, 32) };
      shader.uniforms.uSeaSpec = seaSpecUniform;
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
    mat.customProgramCacheKey = () => "worldmap-terrain-height-fog";

    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Sea disc
    const seaGeo = new THREE.CircleGeometry(25, 128);
    const seaMat = new THREE.MeshPhongMaterial({
      color: 0x42555a,
      specular: new THREE.Color(SEA_SPEC, SEA_SPEC, SEA_SPEC),
      shininess: 750,
      normalMap: seaNormalTexture,
      normalScale: new THREE.Vector2(0.8, 0.8),
      transparent: true,
      depthWrite: false,
    });
    seaMat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeightFogEnabled = heightFogUniform;
      shader.uniforms.uHeightFogDensity = heightFogDensityUniform;
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
    seaMat.customProgramCacheKey = () => "worldmap-sea-height-fog";
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.005;
    sea.renderOrder = 0;
    scene.add(sea);

    // Cloud layer
    const cloudMat = new THREE.MeshBasicMaterial({
      map: buildCloudTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), cloudMat);
    cloudMesh.rotation.x = -Math.PI / 2;
    cloudMesh.position.y = 5.7;
    scene.add(cloudMesh);

    scene.add(camera);

    // Camera framing: explicit free transform if provided, else derive from
    // target + radius (elevation mirrors chronicle's updateCameraFromOrbit).
    const viewOverride = W < 768 && mobileViewRef.current ? mobileViewRef.current : viewRef.current;
    const camTarget = new THREE.Vector3();
    if (viewOverride) {
      camTarget.set(viewOverride.target[0], viewOverride.target[1], viewOverride.target[2]);
      camera.position.set(
        viewOverride.position[0],
        viewOverride.position[1],
        viewOverride.position[2],
      );
    } else {
      camTarget.set(targetX, 0, targetZ);
      const rClamped = Math.max(R_MIN, Math.min(R_MAX, radius));
      const tNorm = Math.max(0, Math.min(1, (rClamped - R_MIN) / (R_MAX - R_MIN)));
      const elevD = ELEV_NEAR + (ELEV_FAR - ELEV_NEAR) * (tNorm * tNorm * (3 - 2 * tNorm));
      camera.position.set(
        camTarget.x,
        camTarget.y + rClamped * Math.sin(elevD),
        camTarget.z + rClamped * Math.cos(elevD),
      );
    }
    camera.lookAt(camTarget);

    // Fog + cloud values scale with the effective camera distance
    const rEff = Math.max(R_MIN, Math.min(R_MAX, camera.position.distanceTo(camTarget)));
    const fogBand = 0.15 * (FOG_NEAR - R_MIN);
    const fogStart = R_MIN + fogBand;
    const fogT = Math.max(0, Math.min(1, (fogStart - rEff) / fogBand));
    (scene.fog as THREE.FogExp2).density = fogT * 0.2;
    heightFogUniform.value = 1.0 * (1 - fogT);
    cloudMat.opacity = clouds ? Math.max(0, Math.min(1, (rEff - 10) / 10)) * 0.75 : 0;

    // Live camera readout (also feeds the "Copy camera" button)
    const updateReadout = () => {
      const p = camera.position;
      snippetRef.current = `view={{ position: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}], target: [${camTarget.x.toFixed(2)}, ${camTarget.y.toFixed(2)}, ${camTarget.z.toFixed(2)}] }}`;
      if (readoutRef.current) readoutRef.current.textContent = snippetRef.current;
    };
    updateReadout();

    // Heightmap pixels (CPU) to anchor markers to terrain height.
    let hmData: Uint8ClampedArray | null = null;
    let hmW = 0;
    let hmH = 0;
    const hmImg = new Image();
    hmImg.onload = () => {
      hmW = hmImg.naturalWidth;
      hmH = hmImg.naturalHeight;
      const c = document.createElement("canvas");
      c.width = hmW;
      c.height = hmH;
      const cx = c.getContext("2d");
      if (cx) {
        cx.drawImage(hmImg, 0, 0);
        hmData = cx.getImageData(0, 0, hmW, hmH).data;
        requestRender();
      }
    };
    hmImg.src = "/heightmap.png";

    const sampleHeight = (tx: number, tz: number) => {
      if (!hmData) return 0;
      const nx = tx / 20 + 0.5;
      const ny = tz / 20 + 0.5;
      const ix = Math.min(hmW - 1, Math.max(0, Math.round(nx * (hmW - 1))));
      const iy = Math.min(hmH - 1, Math.max(0, Math.round(ny * (hmH - 1))));
      return (hmData[(iy * hmW + ix) * 4] / 255) * HEIGHT_SCALE;
    };

    // Project marker world positions to screen and place their overlays.
    let curW = W;
    let curH = H;
    const _markerVec = new THREE.Vector3();
    const positionMarkers = () => {
      const ms = markersRef.current;
      for (let i = 0; i < ms.length; i++) {
        const el = markerElsRef.current.get(i);
        if (!el) continue;
        const m = ms[i];
        const tx = (m.x / MAP_EXTENT) * 10;
        const tz = (m.y / MAP_EXTENT) * 10;
        _markerVec.set(tx, sampleHeight(tx, tz) + 0.05, tz).project(camera);
        if (_markerVec.z > 1) {
          el.style.opacity = "0";
          continue;
        }
        const sx = ((_markerVec.x + 1) / 2) * curW;
        const sy = ((-_markerVec.y + 1) / 2) * curH;
        el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
        el.style.opacity = "1";
      }
    };

    renderer.compile(scene, camera);

    // Cursor-following point light: ray-cast the pointer onto a plane above the
    // tallest peak and park the light there. Intensity eases in/out on hover.
    const CURSOR_LIGHT_MAX = 18;
    const CURSOR_LIGHT_BASE = 18;
    const cursorLight = new THREE.PointLight(0xffd9a0, 0, 30, 1.2);
    cursorLight.position.set(camTarget.x, LIGHT_PLANE_Y, camTarget.z);
    scene.add(cursorLight);
    let lightHover = false;

    const lightDom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const lightPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LIGHT_PLANE_Y);
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    const onHoverMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = lightDom.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(lightPlane, hitPoint)) {
        cursorLight.position.copy(hitPoint);
        lightHover = true;
        requestRender();
      }
    };
    const onHoverLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      lightHover = false;
      requestRender();
    };
    lightDom.addEventListener("pointermove", onHoverMove);
    lightDom.addEventListener("pointerleave", onHoverLeave);
    const cleanupHover = () => {
      lightDom.removeEventListener("pointermove", onHoverMove);
      lightDom.removeEventListener("pointerleave", onHoverLeave);
    };

    // Track scroll so the idle light position updates as the section scrolls.
    const scrollRef = { value: window.scrollY };
    const mountPageTop = mount.getBoundingClientRect().top + window.scrollY;
    const onWindowScroll = () => { scrollRef.value = window.scrollY; requestRender(); };
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    const idleTarget = new THREE.Vector3(camTarget.x, LIGHT_PLANE_Y, camTarget.z);
    // Camera forward projected onto the horizontal plane — travel along this, not world Z.
    const camForward = new THREE.Vector3()
      .subVectors(camTarget, camera.position)
      .setY(0)
      .normalize();

    let raf = 0;
    let onFrame: (() => void) | null = null;
    function loop() {
      raf = requestAnimationFrame(loop);
      if (onFrame) onFrame();
      // When idle, park the light at the responsive default and travel along the camera axis with scroll.
      if (!lightHover) {
        const isMobile = curW < 768;
        const ndcX = isMobile ? 0 : Math.min(0.95, 600 / curW);
        const ndcY = isMobile ? -0.5 : 0;
        const scrollY = scrollRef.value;
        const sectionH = mount?.clientHeight ?? 800;
        const progress = Math.max(0, Math.min(1,
          (scrollY - mountPageTop + window.innerHeight) / (sectionH + window.innerHeight)
        ));
        ndc.set(ndcX, ndcY);
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(lightPlane, hitPoint)) {
          const offset = (progress - 0.5) * 16;
          idleTarget.set(
            hitPoint.x + camForward.x * offset,
            LIGHT_PLANE_Y,
            hitPoint.z + camForward.z * offset,
          );
        }
        // Lerp toward the target so position changes are smooth
        if (cursorLight.position.distanceTo(idleTarget) > 0.005) {
          cursorLight.position.lerp(idleTarget, 0.15);
          needsRender = true;
        }
      }
      // Ease the cursor light toward its hover target intensity.
      const targetIntensity = lightHover ? CURSOR_LIGHT_MAX : CURSOR_LIGHT_BASE;
      const diff = targetIntensity - cursorLight.intensity;
      if (Math.abs(diff) > 0.01) {
        cursorLight.intensity += diff * 0.12;
        needsRender = true;
      } else if (cursorLight.intensity !== targetIntensity) {
        cursorLight.intensity = targetIntensity;
        needsRender = true;
      }
      if (!needsRender) return;
      needsRender = false;
      composer.render();
      positionMarkers();
    }
    loop();

    // Debug controls: drag to rotate the view around the camera position,
    // scroll to pan forward/back along the camera's forward vector.
    let cleanupDebug = () => {};
    if (debug) {
      const dom = renderer.domElement;
      dom.style.cursor = "grab";
      dom.style.touchAction = "none";
      // Camera position stays fixed while dragging; only the look direction rotates.
      const camPos = camera.position.clone();
      const lookDir = new THREE.Vector3().subVectors(camTarget, camPos);
      const dist = Math.max(0.001, lookDir.length());
      lookDir.normalize();
      let el = Math.asin(THREE.MathUtils.clamp(lookDir.y, -1, 1));
      let az = Math.atan2(lookDir.x, lookDir.z);
      let dragging = false;
      let lastX = 0;
      let lastY = 0;

      const apply = () => {
        const ce = Math.cos(el);
        const se = Math.sin(el);
        // Rebuild the look direction and re-anchor the target ahead of the camera.
        camTarget.set(
          camPos.x + dist * ce * Math.sin(az),
          camPos.y + dist * se,
          camPos.z + dist * ce * Math.cos(az),
        );
        camera.position.copy(camPos);
        camera.lookAt(camTarget);
        updateReadout();
        requestRender();
      };

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        dom.setPointerCapture(e.pointerId);
        dom.style.cursor = "grabbing";
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        az -= dx * 0.005;
        el = THREE.MathUtils.clamp(el - dy * 0.005, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
        apply();
      };
      const onUp = (e: PointerEvent) => {
        dragging = false;
        keys.clear();
        try {
          dom.releasePointerCapture(e.pointerId);
        } catch {}
        dom.style.cursor = "grab";
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        // Move the camera (and its target) along the current forward vector.
        const fwd = new THREE.Vector3().subVectors(camTarget, camPos).normalize();
        camPos.addScaledVector(fwd, -e.deltaY * 0.01); // scroll up = forward
        apply();
      };

      // WASD fly movement, active only while dragging.
      const keys = new Set<string>();
      const WORLD_UP = new THREE.Vector3(0, 1, 0);
      const MOVE_SPEED = 0.06; // scene units per frame
      onFrame = () => {
        if (!dragging || keys.size === 0) return;
        const fwd = new THREE.Vector3().subVectors(camTarget, camPos).normalize();
        const right = new THREE.Vector3().crossVectors(fwd, WORLD_UP).normalize();
        const up = WORLD_UP;
        let moved = false;
        if (keys.has("w")) {
          camPos.addScaledVector(fwd, MOVE_SPEED);
          moved = true;
        }
        if (keys.has("s")) {
          camPos.addScaledVector(fwd, -MOVE_SPEED);
          moved = true;
        }
        if (keys.has("d")) {
          camPos.addScaledVector(right, MOVE_SPEED);
          moved = true;
        }
        if (keys.has("a")) {
          camPos.addScaledVector(right, -MOVE_SPEED);
          moved = true;
        }
        if (keys.has("q")) {
          camPos.addScaledVector(up, -MOVE_SPEED);
          moved = true;
        }
        if (keys.has("e")) {
          camPos.addScaledVector(up, MOVE_SPEED);
          moved = true;
        }
        if (moved) apply();
      };
      const onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (k === "w" || k === "a" || k === "s" || k === "d" || k === "q" || k === "e") keys.add(k);
      };
      const onKeyUp = (e: KeyboardEvent) => {
        keys.delete(e.key.toLowerCase());
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      dom.addEventListener("pointerdown", onDown);
      dom.addEventListener("pointermove", onMove);
      dom.addEventListener("pointerup", onUp);
      dom.addEventListener("pointercancel", onUp);
      dom.addEventListener("wheel", onWheel, { passive: false });
      cleanupDebug = () => {
        dom.removeEventListener("pointerdown", onDown);
        dom.removeEventListener("pointermove", onMove);
        dom.removeEventListener("pointerup", onUp);
        dom.removeEventListener("pointercancel", onUp);
        dom.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        onFrame = null;
      };
    }

    function onResize() {
      const w = Math.max(1, mount!.clientWidth);
      const h = Math.max(1, mount!.clientHeight);
      curW = w;
      curH = h;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      requestRender();
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      ro.disconnect();
      cleanupDebug();
      cleanupHover();
      window.removeEventListener("scroll", onWindowScroll);
      cancelAnimationFrame(raf);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      seaGeo.dispose();
      seaMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [targetX, targetZ, radius, clouds, brightness, debug, mobileView]);

  return (
    <div className={cn("relative", className)}>
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {markers.map((m, i) => {
          const kind = m.kind ?? "city";
          return (
            <div
              key={m.name}
              ref={(el) => {
                if (el) markerElsRef.current.set(i, el);
                else markerElsRef.current.delete(i);
              }}
              className="absolute top-0 left-0"
              style={{ opacity: 0, willChange: "transform" }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div
                  className="h-5 w-5"
                  style={{
                    backgroundColor: MARKER_COLOR[kind],
                    WebkitMaskImage: `url(${MARKER_ICON[kind]})`,
                    maskImage: `url(${MARKER_ICON[kind]})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))",
                  }}
                />
                <span
                  className="font-heading absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[13px] tracking-[0.15em] whitespace-nowrap text-white uppercase"
                  style={{ textShadow: "0 1px 4px #000, 0 0 8px #000" }}
                >
                  {m.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {debug && (
        <div className="absolute right-2 bottom-2 left-2 z-10 flex items-center gap-2 rounded bg-black/70 p-2 font-mono text-[11px] text-white/80">
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded bg-white/15 px-2 py-1 hover:bg-white/25"
          >
            Copy camera
          </button>
          <div ref={readoutRef} className="truncate" />
        </div>
      )}
    </div>
  );
}
