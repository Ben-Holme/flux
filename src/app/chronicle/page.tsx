"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LOCATIONS from "@/data/locations.json";
import EVENT_TYPES from "@/components/story-events/event-types";
import { StoryEvent } from "@/components/story-events/use-story-events";
import * as THREE from "three";

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

function buildNorm() {
  const xs = locations.map((l) => parseFloat(l.x));
  const ys = locations.map((l) => parseFloat(l.y));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 0.05;
  return (l: Location) => ({
    nx: pad + ((parseFloat(l.x) - minX) / (maxX - minX)) * (1 - 2 * pad),
    ny: pad + ((parseFloat(l.y) - minY) / (maxY - minY)) * (1 - 2 * pad),
  });
}
const normalize = buildNorm();

// Simple value noise for heightmap (no external deps)
function makeNoise() {
  const p = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];

  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
  function grad(hash: number, x: number, y: number) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  return function noise(x: number, y: number): number {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = p[p[xi] + yi], ab = p[p[xi] + yi + 1];
    const ba = p[p[xi + 1] + yi], bb = p[p[xi + 1] + yi + 1];
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v,
    );
  };
}

function buildDisplacementData(size: number): { data: Float32Array; heightAt: (nx: number, ny: number) => number } {
  const noise = makeNoise();
  const data = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size, ny = y / size;
      let h = 0;
      h += 0.50 * noise(nx * 3, ny * 3);
      h += 0.25 * noise(nx * 6, ny * 6);
      h += 0.12 * noise(nx * 12, ny * 12);
      h += 0.06 * noise(nx * 24, ny * 24);
      h += 0.03 * noise(nx * 48, ny * 48);
      data[y * size + x] = (h + 1) * 0.5; // normalize to [0,1]
    }
  }

  function heightAt(nx: number, ny: number): number {
    const px = Math.min(size - 1, Math.max(0, Math.round(nx * (size - 1))));
    const py = Math.min(size - 1, Math.max(0, Math.round(ny * (size - 1))));
    return data[py * size + px];
  }

  return { data, heightAt };
}

export default function ChroniclePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const rafRef = useRef<number | null>(null);
  const camPosRef = useRef({ x: 0, z: 0, y: 8 }); // camera position in world
  const debugRef = useRef<HTMLDivElement | null>(null);

  // Interaction state
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const pinchMidRef = useRef<{ x: number; y: number } | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [players, setPlayers] = useState<Record<string | number, { name: string }>>({});
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const eventsReq = fetch("https://api.unyhagame.com/ueserv/getstoryevents-w.php").then((r) => r.json());
    const namesReq = fetch("https://api.unyhagame.com/ueserv/getplayernames-w.php").then((r) => r.json()).catch(() => null);
    Promise.all([eventsReq, namesReq]).then(([evData, namesData]) => {
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
    }).catch(() => {}).finally(() => setEventsLoading(false));
  }, []);

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
    scene.background = new THREE.Color(0x0a0c0e);
    scene.fog = new THREE.Fog(0x0a0c0e, 15, 35);
    sceneRef.current = scene;

    // Camera — perspective, pitched 80° down (nearly top-down but slightly angled)
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    // Pitch: rotate camera so it looks steeply down-forward
    // We'll position camera above and slightly behind, looking forward-down
    camera.rotation.order = "YXZ";
    camera.rotation.x = -(Math.PI / 2 - Math.PI * (50 / 180)); // 50° from horizontal (~-0.698 rad)
    cameraRef.current = camera;

    // Lighting
    const ambient = new THREE.AmbientLight(0x334455, 0.5);
    scene.add(ambient);

    // Directional light attached to camera rig so it moves with pan
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
    dirLight.position.set(2, 5, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Secondary fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.5);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // Heightmap
    const hmSize = 256;
    const { data: hmData, heightAt } = buildDisplacementData(hmSize);

    // Displacement texture from heightmap data
    const hmCanvas = document.createElement("canvas");
    hmCanvas.width = hmSize;
    hmCanvas.height = hmSize;
    const hmCtx = hmCanvas.getContext("2d")!;
    const imgData = hmCtx.createImageData(hmSize, hmSize);
    for (let i = 0; i < hmSize * hmSize; i++) {
      const v = Math.floor(hmData[i] * 255);
      imgData.data[i * 4 + 0] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    hmCtx.putImageData(imgData, 0, 0);
    const dispTexture = new THREE.CanvasTexture(hmCanvas);

    // Terrain plane: 20×20 world units, 256×256 segments
    const terrainSize = 20;
    const segments = 256;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);

    // Color texture from world map jpg
    const colorTexture = new THREE.TextureLoader().load("/worldMap.jpg");

    const mat = new THREE.MeshStandardMaterial({
      map: colorTexture,
      displacementMap: dispTexture,
      displacementScale: 4,
      roughness: 0.85,
      metalness: 0.05,
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotation.x = -Math.PI / 2; // lay flat
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Sprite material for location dots
    function makeSpriteMaterial(hasEvent: boolean, color: number) {
      const sc = document.createElement("canvas");
      sc.width = 64; sc.height = 64;
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
        sctx.beginPath(); sctx.arc(32, 32, 20, 0, Math.PI * 2); sctx.fill();
      }
      sctx.fillStyle = hex;
      sctx.beginPath(); sctx.arc(32, 32, r, 0, Math.PI * 2); sctx.fill();
      return new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sc), depthTest: false, transparent: true });
    }

    // Place sprites
    const half = terrainSize / 2;
    const dispScale = 4;
    const sprites: THREE.Sprite[] = [];

    locations.forEach((loc) => {
      const { nx, ny } = normalize(loc);
      const hasEvent = eventLocNames.has(loc.name);
      const color = hasEvent ? GOLD_NUM : 0x888888;
      const mat2 = makeSpriteMaterial(hasEvent, color);
      const sprite = new THREE.Sprite(mat2);
      sprite.scale.set(hasEvent ? 0.22 : 0.16, hasEvent ? 0.22 : 0.16, 1);

      // World position on terrain
      const wx = (nx - 0.5) * terrainSize;
      const wz = (ny - 0.5) * terrainSize;
      const h = heightAt(nx, ny) * dispScale;
      sprite.position.set(wx, h + 0.08, wz);
      (sprite as THREE.Sprite & { locIdx: number }).locIdx = locations.indexOf(loc);

      scene.add(sprite);
      sprites.push(sprite);
    });
    spritesRef.current = sprites;

    // Initial camera position
    const cam = camPosRef.current;
    camera.position.set(cam.x, cam.y, cam.z);
    scene.add(camera);
    // Move lights with camera
    dirLight.position.set(cam.x + 2, cam.y + 5, cam.z + 3);

    // Animation loop
    const PITCH_NEAR = -(Math.PI / 2 - Math.PI * (50 / 180)); // 50° from horizontal (close)
    const PITCH_FAR  = -Math.PI / 2;                          // straight down (far)
    const Y_NEAR = 7, Y_FAR = 35;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      // Keep directional light near camera
      const cp = camPosRef.current;
      const ls = Math.max(1, cp.y);
      dirLight.position.set(cp.x + ls * 0.375, cp.y + ls * 0.75, cp.z + ls * 0.5);
      fillLight.position.set(cp.x - ls * 0.375, cp.y + ls * 0.25, cp.z - ls * 0.25);
      // Tilt camera toward straight-down as zoom distance increases
      const raw = (camera.position.y - Y_NEAR) / (Y_FAR - Y_NEAR);
      const t = Math.max(0, Math.min(1, raw));
      const st = t * t * (3 - 2 * t); // smoothstep
      camera.rotation.x = PITCH_NEAR + (PITCH_FAR - PITCH_NEAR) * st;
      if (debugRef.current) debugRef.current.textContent = `y: ${camera.position.y.toFixed(2)}`;
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
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
      sc.width = 64; sc.height = 64;
      const sctx = sc.getContext("2d")!;
      sctx.clearRect(0, 0, 64, 64);
      const color = hasEvent ? GOLD : "rgba(136,136,136,1)";
      const r = hasEvent ? 10 : 7;
      if (hasEvent) {
        const grd = sctx.createRadialGradient(32, 32, 0, 32, 32, 20);
        grd.addColorStop(0, color); grd.addColorStop(0.5, color); grd.addColorStop(1, "transparent");
        sctx.fillStyle = grd;
        sctx.beginPath(); sctx.arc(32, 32, 20, 0, Math.PI * 2); sctx.fill();
      }
      sctx.fillStyle = color;
      sctx.beginPath(); sctx.arc(32, 32, r, 0, Math.PI * 2); sctx.fill();
      mat.map?.dispose();
      mat.map = new THREE.CanvasTexture(sc);
      mat.needsUpdate = true;
      sprite.scale.set(hasEvent ? 0.22 : 0.16, hasEvent ? 0.22 : 0.16, 1);
    });
  }, [eventLocNames]);

  // Camera update helper
  const updateCamera = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { x, y, z } = camPosRef.current;
    camera.position.set(x, y, z);
  }, []);

  // Pan: move camera in world XZ
  function panCamera(dx: number, dy: number) {
    const mount = mountRef.current;
    if (!mount) return;
    const scale = camPosRef.current.y / mount.clientHeight * 1.6;
    camPosRef.current.x -= dx * scale;
    camPosRef.current.z -= dy * scale;
    updateCamera();
  }

  // Zoom: move camera along world Y axis
  function zoomCamera(factor: number) {
    const camera = cameraRef.current;
    if (!camera) return;
    const step = Math.max(0.5, camPosRef.current.y) * 0.01334;
    camPosRef.current.y = Math.min(35, Math.max(7, camPosRef.current.y + (factor < 1 ? -step : step)));
    camera.position.y = camPosRef.current.y;
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
      zoomCamera(e.deltaY < 0 ? 0.92 : 1.08);
    };
    mount.addEventListener("wheel", onWheel, { passive: false });
    return () => mount.removeEventListener("wheel", onWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.setPointerCapture(e.pointerId);
    const cssX = e.clientX - mount.getBoundingClientRect().left;
    const cssY = e.clientY - mount.getBoundingClientRect().top;
    activePointersRef.current.set(e.pointerId, { x: cssX, y: cssY });

    if (activePointersRef.current.size === 2) {
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

    if (pointerStartRef.current && Math.hypot(cssX - pointerStartRef.current.x, cssY - pointerStartRef.current.y) > 5) {
      draggingRef.current = true;
      lastPosRef.current = { x: cssX, y: cssY };
    }
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
      setSelectedIdx(pickLocation(e.clientX, e.clientY));
    }
    draggingRef.current = false;
    pointerStartRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) { lastPinchDistRef.current = null; pinchMidRef.current = null; }
    draggingRef.current = false;
  }, []);

  const selectedLoc = selectedIdx !== null ? locations[selectedIdx] : null;
  const locEvents = selectedLoc ? events.filter((e) => e.location === selectedLoc.name) : [];

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0c0e" }}>
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
      <div ref={debugRef} style={{ position: "absolute", bottom: 8, left: 8, zIndex: 30, fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.5)", pointerEvents: "none" }} />

      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.85) 100%)" }} />

      {/* Header overlay */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "20px 24px 16px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--gold)", textShadow: `${GOLD} 0px 0px 6px, ${GOLD} 0px 0px 12px` }}>
          Unyha
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>
          Chronicle Map
        </div>
        <div style={{ marginTop: "8px", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
          {eventsLoading ? "Loading events…" : `${events.length} events · ${eventLocNames.size} locations visited`}
        </div>
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 24, left: 24, zIndex: 10, display: "flex", flexDirection: "column", gap: "6px", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", display: "inline-block", boxShadow: `0 0 6px ${GOLD}` }} />
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Has events</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(136,136,136,0.8)", display: "inline-block" }} />
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Location</span>
        </div>
        <div style={{ marginTop: "4px", fontSize: "0.62rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
          Scroll / pinch to zoom · drag to pan
        </div>
      </div>

      {/* Side panel */}
      {selectedLoc && (
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: "min(340px, 90vw)",
          background: "rgba(6,8,10,0.92)",
          backdropFilter: "blur(16px)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          zIndex: 20,
          overflowY: "auto",
          padding: "80px 24px 32px",
        }}>
          <button
            onClick={() => setSelectedIdx(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "1.2rem", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}
            aria-label="Close"
          >×</button>

          <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.15em", color: eventLocNames.has(selectedLoc.name) ? "var(--gold)" : "rgba(255,255,255,0.85)", textShadow: eventLocNames.has(selectedLoc.name) ? `${GOLD} 0 0 8px` : "none", lineHeight: 1.3, marginBottom: "10px" }}>
            {selectedLoc.name}
          </div>

          {selectedLoc.description && (
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>{selectedLoc.description}</p>
          )}
          {selectedLoc.keywords && (
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5, margin: "0 0 20px", fontStyle: "italic" }}>{selectedLoc.keywords}</p>
          )}

          {locEvents.length > 0 && (
            <>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>
                {locEvents.length} event{locEvents.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {locEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type] ?? { label: ev.type, symbol: "·", color: "rgba(255,255,255,0.4)" };
                  const charName = players[ev.primary_char]?.name ?? `#${ev.primary_char}`;
                  return (
                    <div key={i} style={{ borderRadius: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: et.color, fontSize: "0.78rem", letterSpacing: "0.06em" }}>{et.symbol} {et.label}</span>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{ev.date}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>{charName}</div>
                      {ev.special && <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "4px", fontStyle: "italic" }}>{ev.special}</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {locEvents.length === 0 && !eventsLoading && (
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No recorded events at this location.</p>
          )}
        </div>
      )}
    </div>
  );
}
