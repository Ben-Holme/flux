"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LOCATIONS from "@/data/locations.json";
import EVENT_TYPES from "@/components/story-events/event-types";
import { StoryEvent } from "@/components/story-events/use-story-events";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
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

// Orbit constants
const R_MIN = 4, R_MAX = 35;
const ELEV_NEAR = Math.PI * (50 / 180); // camera elevation when close (50° from horizontal)
const ELEV_FAR  = Math.PI / 2;           // camera elevation when far (straight down)

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


export default function ChroniclePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const rafRef = useRef<number | null>(null);
  const camPosRef = useRef({ x: 0, z: 0, y: 8 }); // synced each frame for light positioning
  const targetRef = useRef(new THREE.Vector3(0, 0, 0)); // orbit pivot on terrain
  const radiusRef = useRef(15); // orbit radius (camera → target distance)
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

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    cameraRef.current = camera;

    // Post-processing: SSAO for terrain crevice shading
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const ssaoPass = new SSAOPass(scene, camera, W, H);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.001;
    ssaoPass.maxDistance = 0.25;
    composer.addPass(ssaoPass);
    composer.addPass(new OutputPass());

    // Lighting
    const ambient = new THREE.AmbientLight(0x334455, 0.5);
    scene.add(ambient);

    // Directional light attached to camera rig so it moves with pan
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    dirLight.position.set(2, 5, 3);
    scene.add(dirLight);

    // Secondary fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.5);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // Left-side key light at 45° — casts shadows across terrain relief
    const leftLight = new THREE.DirectionalLight(0xfff8f0, 1.2);
    leftLight.position.set(-1, 1, 0); // left side, 45° elevation
    leftLight.castShadow = true;
    scene.add(leftLight);

    // Load real heightmap PNG as displacement texture
    const dispTexture = new THREE.TextureLoader().load("/heightmap.png");

    // Terrain plane: 20×20 world units, 256×256 segments
    const terrainSize = 20;
    const segments = 256;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);

    // Color texture from world map jpg
    const colorTexture = new THREE.TextureLoader().load("/worldMap.jpg");

    const normalTexture = new THREE.TextureLoader().load("/normalmap.png");

    const mat = new THREE.MeshStandardMaterial({
      map: colorTexture,
      displacementMap: dispTexture,
      displacementScale: 2,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(3, 3), // amplify terrain relief in lighting
      roughness: 0.85,
      metalness: 0.05,
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotation.x = -Math.PI / 2; // lay flat
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Sea plane — sits at y=0.3 so ocean pixels (near 0) are submerged, coastal land just breaks the surface
    const seaGeo = new THREE.PlaneGeometry(500, 500);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a2a,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.3,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.3;
    scene.add(sea);

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
    const dispScale = 2;
    const sprites: THREE.Sprite[] = [];

    locations.forEach((loc) => {
      const { nx, ny } = normalize(loc);
      const hasEvent = eventLocNames.has(loc.name);
      const color = hasEvent ? GOLD_NUM : 0x888888;
      const mat2 = makeSpriteMaterial(hasEvent, color);
      const sprite = new THREE.Sprite(mat2);
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
    hmDecodeCanvas.width = 256; hmDecodeCanvas.height = 256;
    const hmDecodeCtx = hmDecodeCanvas.getContext("2d")!;
    const hmDecodeImg = new Image();
    hmDecodeImg.onload = () => {
      hmDecodeCtx.drawImage(hmDecodeImg, 0, 0, 256, 256);
      const px = hmDecodeCtx.getImageData(0, 0, 256, 256);
      function heightAt(nx: number, ny: number) {
        const ix = Math.min(255, Math.max(0, Math.round(nx * 255)));
        const iy = Math.min(255, Math.max(0, Math.round(ny * 255)));
        return px.data[(iy * 256 + ix) * 4] / 255;
      }
      sprites.forEach((sprite) => {
        const idx = (sprite as THREE.Sprite & { locIdx: number }).locIdx;
        const loc = locations[idx];
        const { nx, ny } = normalize(loc);
        const wx = (nx - 0.5) * terrainSize;
        const wz = (ny - 0.5) * terrainSize;
        sprite.position.set(wx, heightAt(nx, ny) * dispScale + 0.08, wz);
      });
    };
    hmDecodeImg.src = "/heightmap.png";

    scene.add(camera);
    updateCameraFromOrbit(); // set initial position + lookAt from orbit state

    // Animation loop
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      updateCameraFromOrbit();
      const cp = camPosRef.current;
      const ls = Math.max(1, cp.y);
      dirLight.position.set(cp.x + ls * 0.375, cp.y + ls * 0.75, cp.z + ls * 0.5);
      fillLight.position.set(cp.x - ls * 0.375, cp.y + ls * 0.25, cp.z - ls * 0.25);
      if (debugRef.current) debugRef.current.textContent = `r: ${radiusRef.current.toFixed(2)}`;
      composer.render();
    }
    animate();

    // Resize handler
    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      ssaoPass.setSize(w, h);
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
    camPosRef.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  }

  // Pan: translate target (and camera follows) horizontally
  function panCamera(dx: number, dy: number) {
    const mount = mountRef.current;
    if (!mount) return;
    const scale = radiusRef.current / mount.clientHeight * 1.6;
    targetRef.current.x -= dx * scale;
    targetRef.current.z -= dy * scale;
  }

  // Zoom: change orbit radius, keeping target fixed
  function zoomCamera(factor: number) {
    const step = Math.max(0.5, radiusRef.current) * 0.01334;
    radiusRef.current = Math.min(R_MAX, Math.max(R_MIN, radiusRef.current + (factor < 1 ? -step : step)));
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
      for (let i = 0; i < 10; i++) zoomCamera(dir);
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
