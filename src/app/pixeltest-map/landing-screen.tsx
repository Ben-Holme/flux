"use client";
import { useEffect, useRef, useState } from "react";

const WORLD_W = 14000;
const WORLD_H = 12500;

// Wraith Wagon path — northern corridor, left to right, looping
const BUS_PATH: [number, number][] = [
  [-800, 380],
  [800,  320],
  [3450, 280],
  [7000, 260],
  [11000, 320],
  [14800, 450],
];
const BUS_LOOP_S = 16; // seconds to complete one pass

const MAP_LOCATIONS: [number, number, string, string, number][] = [
  [1050,  1000, "Village",            "#ffd98f", 5],
  [3450,  900,  "The Mine",           "#80705f", 4],
  [3700,  2200, "Orc Camp",           "#4a7a40", 4],
  [3500,  3000, "Graveyard",          "#564870", 4],
  [4500,  3200, "Wandering Merchant", "#ffa200", 3],
  [800,   300,  "Unyha Tree",         "#40261a", 3],
];

const MAP_ZONES: [number[], string][] = [
  [[1500,5000, 6000,5000, 6000,10500, 1500,10500], "#1a2e1a"],
  [[5000,1500, 9000,1500, 9000,5000, 5000,5000],   "#2a2018"],
  [[9000,7000, 13500,7000, 13500,12500, 9000,12500],"#1a1820"],
  [[5800,100,  8200,100,  8200,1400, 5800,1400],   "#201e1a"],
  [[0,0, 5000,0, 5000,5000, 0,5000],               "#182018"],
  [[2900,400, 4200,400, 4200,1400, 2900,1400],     "#141214"],
];

const MAP_ROADS: [number, number, number, number][] = [
  [800, 300, 1050, 1000],
  [1050, 1000, 3450, 900],
  [3450, 900, 7000, 700],
  [7000, 700, 7000, 3000],
  [3450, 900, 3700, 2200],
  [1050, 1000, 3500, 3000],
  [3700, 2200, 3500, 3000],
  [3500, 3000, 4500, 3200],
  [4500, 3200, 7000, 3000],
  [3500, 3000, 3500, 8000],
  [7000, 3000, 11000, 9500],
  [11000, 9500, 12400, 10600],
];

const ZONE_LABELS: [number, number, string, string][] = [
  [7000, 3000, "Eastern Badlands", "#7a6040"],
  [3500, 7500, "Deep Forest",      "#3a5a3a"],
  [11000, 9200, "Forsaken Fort",   "#3a3545"],
  [7000, 700,  "Ruined Village",   "#5a5040"],
];

// Named quick-select landing spots
const QUICK_SPOTS: [string, number, number, string][] = [
  ["Village",        1050, 1050, "#ffd98f"],
  ["The Mine",       3450,  900, "#80705f"],
  ["Graveyard",      3500, 3000, "#564870"],
  ["Ruined Village", 7000,  700, "#80705f"],
];

export default function LandingScreen({
  charName,
  onLand,
}: {
  charName: string;
  onLand: (x: number, y: number) => void;
}) {
  const W = 600;
  const H = 490;
  const sx = (x: number) => (x / WORLD_W) * W;
  const sy = (y: number) => (y / WORLD_H) * H;

  const [busPos, setBusPos] = useState<[number, number]>([-800, 380]);
  const [choice, setChoice] = useState<[number, number] | null>(null);
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const progressRef = useRef(0);
  const frameRef = useRef(0);
  const firedRef = useRef(false);
  // Keep stable ref for Space-key handler (avoids stale closure on busPos)
  const choiceRef = useRef<[number, number] | null>(null);
  const busPosRef = useRef<[number, number]>([-800, 380]);

  // Animate the Wraith Wagon across the map
  useEffect(() => {
    let prev = performance.now();
    function tick(now: number) {
      const dt = (now - prev) / 1000;
      prev = now;
      progressRef.current += dt / BUS_LOOP_S;
      if (progressRef.current >= 1) progressRef.current -= 1;

      const t = progressRef.current * (BUS_PATH.length - 1);
      const i = Math.floor(t);
      const f = t - i;
      const a = BUS_PATH[Math.min(i, BUS_PATH.length - 1)];
      const b = BUS_PATH[Math.min(i + 1, BUS_PATH.length - 1)];
      const pos: [number, number] = [
        a[0] + (b[0] - a[0]) * f,
        a[1] + (b[1] - a[1]) * f,
      ];
      busPosRef.current = pos;
      setBusPos(pos);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Space / Enter: land at chosen spot or current wagon position
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      fire(choiceRef.current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function nearestName(wx: number, wy: number): string | null {
    let best: string | null = null;
    let bestD = 1500;
    for (const [lx, ly, name] of MAP_LOCATIONS) {
      const d = Math.hypot(wx - lx, wy - ly);
      if (d < bestD) { bestD = d; best = name; }
    }
    return best;
  }

  function fire(pos: [number, number] | null) {
    if (firedRef.current) return;
    firedRef.current = true;
    const [wx, wy] = pos ?? busPosRef.current;
    onLand(
      Math.max(200, Math.min(WORLD_W - 200, wx)),
      Math.max(200, Math.min(WORLD_H - 200, wy)),
    );
  }

  function handleMapClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const wx = ((e.clientX - rect.left) / W) * WORLD_W;
    const wy = ((e.clientY - rect.top) / H) * WORLD_H;
    const pos: [number, number] = [wx, wy];
    choiceRef.current = pos;
    setChoice(pos);
    setNearLabel(nearestName(wx, wy));
  }

  function pickQuick(wx: number, wy: number, name: string) {
    const pos: [number, number] = [wx, wy];
    choiceRef.current = pos;
    setChoice(pos);
    setNearLabel(name);
  }

  const bsx = sx(busPos[0]);
  const bsy = sy(busPos[1]);
  const cx = choice ? sx(choice[0]) : null;
  const cy = choice ? sy(choice[1]) : null;

  return (
    <div
      className="absolute inset-0 z-[3000003] flex flex-col items-center justify-center bg-[#06040a]"
      style={{ userSelect: "none" }}
    >
      {/* Title */}
      <div className="mb-3 text-center">
        <p className="text-[#3d3555] font-mono text-[9px] tracking-[0.6em] uppercase mb-1">
          — The Crossing —
        </p>
        <p className="text-[#ffd98f] font-mono text-[12px] tracking-[0.3em] uppercase">
          Where does {charName} begin their story?
        </p>
      </div>

      {/* World map */}
      <div className="border border-[#2c2640]">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block", cursor: "crosshair", background: "#0d0b12" }}
          onClick={handleMapClick}
        >
          {/* Zone fills */}
          {MAP_ZONES.map(([pts, fill], i) => (
            <polygon
              key={i}
              points={pts.map((v, j) => (j % 2 === 0 ? sx(v) : sy(v))).join(" ")}
              fill={fill}
              opacity={0.9}
            />
          ))}

          {/* Roads */}
          {MAP_ROADS.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)}
              stroke="#3a2100" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5}
            />
          ))}

          {/* Wagon trail */}
          <polyline
            points={BUS_PATH.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ")}
            fill="none"
            stroke="#3d3555"
            strokeWidth={0.8}
            strokeDasharray="3 7"
            opacity={0.45}
          />

          {/* Zone labels */}
          {ZONE_LABELS.map(([wx, wy, label, col], i) => (
            <text
              key={i}
              x={sx(wx)} y={sy(wy)}
              textAnchor="middle" fill={col} fontSize={9} fontFamily="monospace" opacity={0.65}
            >
              {label}
            </text>
          ))}

          {/* Location dots + labels */}
          {MAP_LOCATIONS.filter(l => l[4] > 0).map(([wx, wy, label, color, r], i) => (
            <g key={i}>
              <circle cx={sx(wx)} cy={sy(wy)} r={r + 2} fill={color} opacity={0.18} />
              <circle cx={sx(wx)} cy={sy(wy)} r={r} fill={color} />
              <text x={sx(wx) + r + 3} y={sy(wy) + 3} fill={color} fontSize={8} fontFamily="monospace" opacity={0.85}>
                {label}
              </text>
            </g>
          ))}

          {/* Wraith Wagon icon */}
          {bsx >= -6 && bsx <= W + 6 && (
            <g transform={`translate(${bsx.toFixed(1)},${bsy.toFixed(1)})`}>
              <circle r={8} fill="#0d0b12" stroke="#7B2FBE" strokeWidth={1.3} />
              <text textAnchor="middle" y={4} fontSize={10} fill="#B870F0" fontFamily="monospace">⬡</text>
            </g>
          )}

          {/* Landing crosshair */}
          {cx !== null && cy !== null && (
            <g>
              <line x1={cx - 15} y1={cy} x2={cx + 15} y2={cy} stroke="#ffd98f" strokeWidth={0.7} opacity={0.6} />
              <line x1={cx} y1={cy - 15} x2={cx} y2={cy + 15} stroke="#ffd98f" strokeWidth={0.7} opacity={0.6} />
              <circle cx={cx} cy={cy} r={9} fill="none" stroke="#ffd98f" strokeWidth={1.4} />
              <circle cx={cx} cy={cy} r={2.5} fill="#ffd98f" />
            </g>
          )}
        </svg>
      </div>

      {/* Quick-select spots */}
      <div className="mt-3 flex gap-2">
        {QUICK_SPOTS.map(([name, wx, wy]) => (
          <button
            key={name}
            onClick={() => pickQuick(wx, wy, name)}
            className="px-3 py-1 font-mono text-[9px] tracking-[0.3em] uppercase border border-[#2c2640] text-[#564870] hover:border-[#564870] hover:text-[#9d7fd4] transition-colors"
          >
            {name}
          </button>
        ))}
      </div>

      {/* Status + confirm */}
      <div className="mt-3 flex flex-col items-center gap-2">
        <p
          className="font-mono text-[9px] tracking-[0.35em] uppercase"
          style={{ color: nearLabel ? "#c8923a" : "#3d3555" }}
        >
          {nearLabel ?? (choice ? "Unmarked territory" : "Click map or press SPACE to drop from wagon")}
        </p>
        <button
          onClick={() => fire(choiceRef.current)}
          className={`px-8 py-2 font-mono text-[10px] tracking-[0.45em] uppercase border transition-all duration-200 ${
            choice
              ? "border-[#ffd98f] text-[#ffd98f] hover:bg-[#ffd98f]/10"
              : "border-[#3d3555] text-[#3d3555] hover:border-[#564870] hover:text-[#564870]"
          }`}
        >
          {choice ? "Land Here" : "Drop from Wagon"}
        </button>
      </div>
    </div>
  );
}
