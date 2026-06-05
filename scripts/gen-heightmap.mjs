import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Number parser ──────────────────────────────────────────────────────────
// Format: European — space = thousands sep, comma = decimal sep.
// E.g. "-309 999,969" → -309999.969, "-270 000" → -270000
// The field separator is also a comma, so we must distinguish:
//   decimal comma: followed by exactly 1-3 digits then end / comma / end-of-line
//   field separator comma: followed by optional sign then digit groups
// Regex: optional sign, 1-3 digits, (space+3digits)*, optional (comma+1-3digits not followed by space-or-digit)
const NUM_RE = /-?\d{1,3}(?:\s\d{3})*(?:,\d{1,3}(?![\s\d]))?/g;

function parseNum(s) {
  return parseFloat(s.replace(/\s/g, "").replace(",", "."));
}

function parseLine(line) {
  const matches = [...line.matchAll(NUM_RE)].map(m => m[0]);
  if (matches.length < 3) return null;
  return { x: parseNum(matches[0]), y: parseNum(matches[1]), z: parseNum(matches[2]) };
}

// ── Parse heightmap.txt ────────────────────────────────────────────────────
const raw = readFileSync(resolve(root, "src/data/heightmap.txt"), "utf8");
const points = [];
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (!t) continue;
  const p = parseLine(t);
  if (p) points.push(p);
}
console.log(`Parsed ${points.length} points`);

// Round coordinates to nearest 10000 to normalise floating-point grid values
// (some entries are -269999.938 instead of -270000 etc.)
const STEP = 10000;
const rounded = points.map(({ x, y, z }) => ({
  x: Math.round(x / STEP) * STEP,
  y: Math.round(y / STEP) * STEP,
  z,
}));

// Build grid: for duplicate (x,y) pairs, average z
const zMap = new Map();
const countMap = new Map();
for (const { x, y, z } of rounded) {
  const k = `${x},${y}`;
  zMap.set(k, (zMap.get(k) ?? 0) + z);
  countMap.set(k, (countMap.get(k) ?? 0) + 1);
}
for (const [k, sum] of zMap) zMap.set(k, sum / countMap.get(k));

const xs = [...new Set(rounded.map(p => p.x))].sort((a, b) => a - b);
const ys = [...new Set(rounded.map(p => p.y))].sort((a, b) => a - b);
const GW = xs.length, GH = ys.length;
console.log(`Grid: ${GW}×${GH}`);

const xiMap = new Map(xs.map((v, i) => [v, i]));
const yiMap = new Map(ys.map((v, i) => [v, i]));
const grid = new Float32Array(GW * GH);
for (const [k, z] of zMap) {
  const [xStr, yStr] = k.split(",");
  const ix = xiMap.get(parseInt(xStr, 10));
  const iy = yiMap.get(parseInt(yStr, 10));
  if (ix !== undefined && iy !== undefined) grid[iy * GW + ix] = z;
}

// Normalize z to [0, 1]
let zMin = Infinity, zMax = -Infinity;
for (const v of grid) { if (v < zMin) zMin = v; if (v > zMax) zMax = v; }
console.log(`z range: ${zMin.toFixed(1)} → ${zMax.toFixed(1)}`);
const normGrid = new Float32Array(GW * GH);
for (let i = 0; i < grid.length; i++) normGrid[i] = (grid[i] - zMin) / (zMax - zMin);

// ── Bilinear upscale to 256×256 ────────────────────────────────────────────
const OUT = 256;
const pixels = new Uint8Array(OUT * OUT);

function sample(gx, gy) {
  const x0 = Math.max(0, Math.min(GW - 2, Math.floor(gx)));
  const y0 = Math.max(0, Math.min(GH - 2, Math.floor(gy)));
  const tx = gx - x0, ty = gy - y0;
  return normGrid[y0 * GW + x0]       * (1 - tx) * (1 - ty)
       + normGrid[y0 * GW + (x0+1)]   * tx       * (1 - ty)
       + normGrid[(y0+1) * GW + x0]   * (1 - tx) * ty
       + normGrid[(y0+1) * GW + (x0+1)] * tx     * ty;
}

for (let py = 0; py < OUT; py++) {
  for (let px = 0; px < OUT; px++) {
    pixels[py * OUT + px] = Math.round(
      sample((px / (OUT - 1)) * (GW - 1), (py / (OUT - 1)) * (GH - 1)) * 255
    );
  }
}

// ── Minimal grayscale PNG encoder (Node.js built-in zlib) ─────────────────
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const tb = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}

// Scanlines with filter byte 0 (None)
const scanlines = Buffer.allocUnsafe(OUT * (1 + OUT));
for (let y = 0; y < OUT; y++) {
  scanlines[y * (1 + OUT)] = 0;
  for (let x = 0; x < OUT; x++) scanlines[y * (1 + OUT) + 1 + x] = pixels[y * OUT + x];
}
const ihdr = Buffer.allocUnsafe(13);
ihdr.writeUInt32BE(OUT, 0); ihdr.writeUInt32BE(OUT, 4);
ihdr[8]=8; ihdr[9]=0; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

const png = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk("IHDR", ihdr),
  pngChunk("IDAT", deflateSync(scanlines)),
  pngChunk("IEND", Buffer.alloc(0)),
]);

const outPath = resolve(root, "public/heightmap.png");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, png);
console.log(`Written ${png.length} bytes → public/heightmap.png`);

// ── Normal map from height gradient (finite differences) ───────────────────
// Terrain: 20 world units wide, dispScale 2, OUT×OUT texture.
// Slope = height_diff_in_world_units / horizontal_dist_in_world_units
// K = dispScale * OUT / (255 * terrainSize)  (converts pixel delta to world slope)
const terrainSize = 20, dispScale = 2;
const K = dispScale * OUT / (255 * terrainSize); // ≈ 0.1

const normScanlines = Buffer.allocUnsafe(OUT * (1 + OUT * 3)); // RGB
for (let py = 0; py < OUT; py++) {
  normScanlines[py * (1 + OUT * 3)] = 0; // filter byte
  for (let px = 0; px < OUT; px++) {
    const hL = pixels[py  * OUT + Math.max(0, px - 1)];
    const hR = pixels[py  * OUT + Math.min(OUT - 1, px + 1)];
    const hU = pixels[Math.max(0, py - 1) * OUT + px];
    const hD = pixels[Math.min(OUT - 1, py + 1) * OUT + px];

    // Tangent-space surface normal: -slope in X, -slope in Y, 1
    const dx = (hR - hL) * K;
    const dy = (hD - hU) * K; // image Y = world -Z, kept consistent
    const len = Math.sqrt(dx * dx + dy * dy + 1);
    const nx = -dx / len, ny = -dy / len, nz = 1 / len;

    // Encode to [0, 255]: 0.5+x*0.5 maps [-1,1] → [0,1]
    const base = py * (1 + OUT * 3) + 1 + px * 3;
    normScanlines[base + 0] = Math.round((nx * 0.5 + 0.5) * 255);
    normScanlines[base + 1] = Math.round((ny * 0.5 + 0.5) * 255);
    normScanlines[base + 2] = Math.round((nz * 0.5 + 0.5) * 255);
  }
}

const nmIhdr = Buffer.allocUnsafe(13);
nmIhdr.writeUInt32BE(OUT, 0); nmIhdr.writeUInt32BE(OUT, 4);
nmIhdr[8]=8; nmIhdr[9]=2; nmIhdr[10]=0; nmIhdr[11]=0; nmIhdr[12]=0; // color type 2 = RGB

const nmPng = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk("IHDR", nmIhdr),
  pngChunk("IDAT", deflateSync(normScanlines)),
  pngChunk("IEND", Buffer.alloc(0)),
]);

const nmPath = resolve(root, "public/normalmap.png");
writeFileSync(nmPath, nmPng);
console.log(`Written ${nmPng.length} bytes → public/normalmap.png`);
