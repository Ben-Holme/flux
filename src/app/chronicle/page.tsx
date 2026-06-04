"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LOCATIONS from "@/data/locations.json";
import EVENT_TYPES from "@/components/story-events/event-types";
import { StoryEvent } from "@/components/story-events/use-story-events";

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

function buildNorm() {
  const xs = locations.map((l) => parseFloat(l.x));
  const ys = locations.map((l) => parseFloat(l.y));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 0.05;
  return (l: Location) => ({
    nx: pad + ((parseFloat(l.x) - minX) / (maxX - minX)) * (1 - 2 * pad),
    // Do NOT negate: high game-y maps to bottom of canvas (south at top → north at bottom is wrong;
    // game y increases southward in screen space, so no flip needed)
    ny: pad + ((parseFloat(l.y) - minY) / (maxY - minY)) * (1 - 2 * pad),
  });
}
const normalize = buildNorm();

function drawMap(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  pan: { x: number; y: number },
  zoom: number,
  eventLocNames: Set<string>,
  hoveredIdx: number | null,
  selectedIdx: number | null,
  img: HTMLImageElement | null,
) {
  ctx.clearRect(0, 0, cssW, cssH);

  ctx.fillStyle = "#0a0c0e";
  ctx.fillRect(0, 0, cssW, cssH);

  if (img) {
    ctx.drawImage(img, pan.x, pan.y, cssW * zoom, cssH * zoom);
    // Darken so dots remain readable against the map
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(pan.x, pan.y, cssW * zoom, cssH * zoom);
  }

  locations.forEach((loc, i) => {
    const { nx, ny } = normalize(loc);
    const cx = pan.x + nx * cssW * zoom;
    const cy = pan.y + ny * cssH * zoom;

    const hasEvent = eventLocNames.has(loc.name);
    const isHovered = hoveredIdx === i;
    const isSelected = selectedIdx === i;
    const r = isHovered || isSelected ? 5 : hasEvent ? 4 : 3;

    if (hasEvent) {
      ctx.shadowBlur = isHovered ? 16 : 8;
      ctx.shadowColor = GOLD;
      ctx.fillStyle = isSelected ? "#fff" : isHovered ? "#dba84e" : GOLD;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = isHovered ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.18)";
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isHovered || isSelected) {
      ctx.font = `${Math.max(10, 11 * Math.min(zoom, 1.5))}px Inter, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillStyle = hasEvent ? GOLD : "rgba(255,255,255,0.7)";
      ctx.fillText(loc.name, cx + 8, cy + 4);
    }
  });
}

function hitTest(
  cssX: number, cssY: number,
  pan: { x: number; y: number },
  zoom: number,
  cssW: number, cssH: number,
): number | null {
  let best = -1, bestDist = 18;
  locations.forEach((loc, i) => {
    const { nx, ny } = normalize(loc);
    const cx = pan.x + nx * cssW * zoom;
    const cy = pan.y + ny * cssH * zoom;
    const d = Math.hypot(cssX - cx, cssY - cy);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best === -1 ? null : best;
}

export default function ChroniclePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const hoveredRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Multi-touch tracking for pinch-to-zoom
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

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap(ctx, cssW, cssH, panRef.current, zoomRef.current, eventLocNames, hoveredRef.current, selectedIdx, imgRef.current);
  }, [eventLocNames, selectedIdx]);

  useEffect(() => {
    const img = new Image();
    img.src = "/worldMap.jpg";
    img.onload = () => { imgRef.current = img; redraw(); };
  }, [redraw]);

  const initDone = useRef(false);
  useEffect(() => {
    if (initDone.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW === 0) return;
    initDone.current = true;
    panRef.current = { x: cssW * 0.5 * (1 - zoomRef.current), y: cssH * 0.5 * (1 - zoomRef.current) };
    redraw();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      redraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      redraw();
    });
  }, [redraw]);

  // Non-passive wheel listener so we can preventDefault and block page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      applyZoom(mx, my, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleRedraw]);

  function applyZoom(mx: number, my: number, factor: number) {
    const newZoom = Math.max(0.3, Math.min(8, zoomRef.current * factor));
    panRef.current = {
      x: mx + (panRef.current.x - mx) * (newZoom / zoomRef.current),
      y: my + (panRef.current.y - my) * (newZoom / zoomRef.current),
    };
    zoomRef.current = newZoom;
    scheduleRedraw();
  }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    activePointersRef.current.set(e.pointerId, { x: cssX, y: cssY });

    if (activePointersRef.current.size === 2) {
      // Second finger down — begin pinch
      const pts = Array.from(activePointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchMidRef.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      draggingRef.current = true; // suppress tap-select when fingers lift
    } else {
      lastPosRef.current = { x: cssX, y: cssY };
      pointerStartRef.current = { x: cssX, y: cssY };
      draggingRef.current = false;
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    activePointersRef.current.set(e.pointerId, { x: cssX, y: cssY });

    if (activePointersRef.current.size >= 2) {
      // Pinch zoom — compute distance between first two tracked pointers
      const pts = Array.from(activePointersRef.current.values());
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

      if (lastPinchDistRef.current !== null && lastPinchDistRef.current > 0) {
        applyZoom(mid.x, mid.y, newDist / lastPinchDistRef.current);
      }
      lastPinchDistRef.current = newDist;
      pinchMidRef.current = mid;
      return;
    }

    // Single pointer — pan or hover
    if (draggingRef.current) {
      panRef.current = {
        x: panRef.current.x + (cssX - lastPosRef.current.x),
        y: panRef.current.y + (cssY - lastPosRef.current.y),
      };
      lastPosRef.current = { x: cssX, y: cssY };
      scheduleRedraw();
      return;
    }

    if (pointerStartRef.current && Math.hypot(cssX - pointerStartRef.current.x, cssY - pointerStartRef.current.y) > 4) {
      draggingRef.current = true;
      lastPosRef.current = { x: cssX, y: cssY };
      canvas.style.cursor = "grabbing";
      return;
    }

    // Hover hit-test (mouse only — skip on touch to avoid stale highlights)
    if (e.pointerType !== "touch") {
      const newHovered = hitTest(cssX, cssY, panRef.current, zoomRef.current, canvas.clientWidth, canvas.clientHeight);
      if (newHovered !== hoveredRef.current) {
        hoveredRef.current = newHovered;
        canvas.style.cursor = newHovered !== null ? "pointer" : "grab";
        scheduleRedraw();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleRedraw]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wasPinching = activePointersRef.current.size >= 2;
    activePointersRef.current.delete(e.pointerId);

    if (wasPinching) {
      lastPinchDistRef.current = null;
      pinchMidRef.current = null;
      // If one finger remains, seed it as a pan continuation (not a tap)
      if (activePointersRef.current.size === 1) {
        const [remaining] = Array.from(activePointersRef.current.values());
        lastPosRef.current = remaining;
        pointerStartRef.current = remaining;
        draggingRef.current = true; // prevent accidental tap-select on pinch release
      }
      return;
    }

    canvas.style.cursor = hoveredRef.current !== null ? "pointer" : "grab";
    if (!draggingRef.current) {
      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      const idx = hitTest(cssX, cssY, panRef.current, zoomRef.current, canvas.clientWidth, canvas.clientHeight);
      setSelectedIdx(idx);
    }
    draggingRef.current = false;
    pointerStartRef.current = null;
  }, []);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
      pinchMidRef.current = null;
    }
    draggingRef.current = false;
  }, []);

  const selectedLoc = selectedIdx !== null ? locations[selectedIdx] : null;
  const locEvents = selectedLoc ? events.filter((e) => e.location === selectedLoc.name) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c0e", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "80px" }}>
    <div style={{ position: "relative", width: "min(100vw, 800px)", aspectRatio: "1", overflow: "hidden", flexShrink: 0 }}>
      {/* Header overlay */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "20px 24px 16px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "var(--gold)",
          textShadow: `${GOLD} 0px 0px 6px, ${GOLD} 0px 0px 12px`,
        }}>
          Unyha
        </div>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.85)",
          marginTop: "2px",
        }}>
          Chronicle Map
        </div>
        <div style={{ marginTop: "8px", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
          {eventsLoading ? "Loading events…" : `${events.length} events · ${eventLocNames.size} locations visited`}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 24, left: 24, zIndex: 10,
        display: "flex", flexDirection: "column", gap: "6px",
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", display: "inline-block", boxShadow: `0 0 6px ${GOLD}` }} />
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Has events</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "inline-block" }} />
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Location</span>
        </div>
        <div style={{ marginTop: "4px", fontSize: "0.62rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
          Scroll / pinch to zoom · drag to pan
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

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
            style={{
              position: "absolute", top: 20, right: 20,
              background: "none", border: "none",
              color: "rgba(255,255,255,0.35)", fontSize: "1.2rem",
              cursor: "pointer", lineHeight: 1, padding: "4px 8px",
            }}
            aria-label="Close"
          >
            ×
          </button>

          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: eventLocNames.has(selectedLoc.name) ? "var(--gold)" : "rgba(255,255,255,0.85)",
            textShadow: eventLocNames.has(selectedLoc.name) ? `${GOLD} 0 0 8px` : "none",
            lineHeight: 1.3,
            marginBottom: "10px",
          }}>
            {selectedLoc.name}
          </div>

          {selectedLoc.description && (
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
              {selectedLoc.description}
            </p>
          )}

          {selectedLoc.keywords && (
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5, margin: "0 0 20px", fontStyle: "italic" }}>
              {selectedLoc.keywords}
            </p>
          )}

          {locEvents.length > 0 && (
            <>
              <div style={{
                fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.3)", marginBottom: "10px",
              }}>
                {locEvents.length} event{locEvents.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {locEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type] ?? { label: ev.type, symbol: "·", color: "rgba(255,255,255,0.4)" };
                  const charName = players[ev.primary_char]?.name ?? `#${ev.primary_char}`;
                  return (
                    <div key={i} style={{
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "10px 12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: et.color, fontSize: "0.78rem", letterSpacing: "0.06em" }}>
                          {et.symbol} {et.label}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{ev.date}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>{charName}</div>
                      {ev.special && (
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "4px", fontStyle: "italic" }}>
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
    </div>
    </div>
  );
}
