"use client";

import { useState, useMemo } from "react";
import enemiesData from "@/data/enemies.json";
import Button from "@/components/button";
import {
  Badge,
  Card,
  Flow,
  Heading,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  Text,
} from "@/components/ui";

// ── Types ────────────────────────────────────────────────────────────────────

interface Enemy {
  n: string;
  hp: number;
  mel: number;
  arc: number;
  def: number;
  mag: number;
  spd: number;
  hsp: number;
  dpct: number | null;
}

type Filter = "all" | "combat" | "nodata" | "melee" | "archery";
type SortKey = keyof Omit<Enemy, "n">;

// ── Helpers (module scope) ────────────────────────────────────────────────────

const { max: MAX_PCT, enemies: ALL_ENEMIES } = enemiesData as {
  max: number;
  enemies: Enemy[];
};
const PER_PAGE = 50;

function getType(e: Enemy): "melee" | "archery" | "both" | "magic" | "none" {
  if (e.mel !== 0 && e.arc === 0) return "melee";
  if (e.arc !== 0 && e.mel === 0) return "archery";
  if (e.mel !== 0 && e.arc !== 0) return "both";
  if (e.mag !== 0 && e.mel === 0 && e.arc === 0) return "magic";
  return "none";
}

/** Green (0 %) → Yellow (50 %) → Red (100 % of MAX_PCT) */
function dmgColor(pct: number): string {
  const t = Math.min(pct / 100, 1);
  if (t <= 0.5) {
    const r = Math.round(t * 2 * 255);
    return `rgb(${r},200,60)`;
  }
  const u = (t - 0.5) * 2;
  const g = Math.round((1 - u) * 180);
  return `rgb(240,${g},40)`;
}

function numSign(v: number): string {
  return v > 0 ? `+${v.toLocaleString()}` : v.toLocaleString();
}

// ── Pre-computed stats ────────────────────────────────────────────────────────

const combatEnemies = ALL_ENEMIES.filter((e) => e.dpct !== null) as (Enemy & {
  dpct: number;
})[];
const noDataEnemies = ALL_ENEMIES.filter((e) => e.dpct === null);
const maxDmgEnemy = combatEnemies.reduce<(Enemy & { dpct: number }) | null>(
  (best, e) => (best === null || e.dpct > best.dpct ? e : best),
  null,
);
const avgDmg =
  combatEnemies.length > 0
    ? combatEnemies.reduce((s, e) => s + e.dpct, 0) / combatEnemies.length
    : 0;
const maxHpEnemy = ALL_ENEMIES.reduce<Enemy | null>(
  (best, e) => (best === null || e.hp > best.hp ? e : best),
  null,
);

// ── Component ─────────────────────────────────────────────────────────────────

export function GameRulesTab() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dpct");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = ALL_ENEMIES as Enemy[];
    if (q) list = list.filter((e) => e.n.toLowerCase().includes(q));
    if (filter === "combat") list = list.filter((e) => e.dpct !== null);
    if (filter === "nodata") list = list.filter((e) => e.dpct === null);
    if (filter === "melee") list = list.filter((e) => e.mel !== 0);
    if (filter === "archery") list = list.filter((e) => e.arc !== 0);
    const dir = sortAsc ? 1 : -1;
    return [...list].sort((a, b) => {
      let av = a[sortKey] as number | null;
      let bv = b[sortKey] as number | null;
      if (av === null) av = sortAsc ? Infinity : -Infinity;
      if (bv === null) bv = sortAsc ? Infinity : -Infinity;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  }, [filter, search, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
    setPage(1);
  }

  function handleFilter(f: Filter) { setFilter(f); setPage(1); }
  function handleSearch(v: string) { setSearch(v); setPage(1); }

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (
      <span className="ml-1 text-gold">{sortAsc ? "↑" : "↓"}</span>
    ) : null;

  const filterLabels: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${ALL_ENEMIES.length})` },
    { key: "combat", label: `Combat (${combatEnemies.length})` },
    { key: "nodata", label: `No data (${noDataEnemies.length})` },
    { key: "melee", label: "Melee" },
    { key: "archery", label: "Archery" },
  ];

  return (
    <Flow>
      <Heading level="h2">Game Rules</Heading>
      <Text variant="muted">
        Enemy AI stat deltas from base. Damage% relative to server max ({MAX_PCT}%).
      </Text>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1">
          <Text as="span" variant="muted" className="text-xs uppercase tracking-wider">Total</Text>
          <Text as="span" className="text-2xl font-semibold">{ALL_ENEMIES.length}</Text>
          <Text as="span" variant="muted" className="text-xs">enemies</Text>
        </Card>
        <Card className="flex flex-col gap-1">
          <Text as="span" variant="muted" className="text-xs uppercase tracking-wider">Highest Dmg</Text>
          <Text as="span" className="text-2xl font-semibold text-ember">
            {maxDmgEnemy ? `${maxDmgEnemy.dpct.toFixed(1)}%` : "—"}
          </Text>
          <Text as="span" variant="muted" className="text-xs">{maxDmgEnemy?.n ?? "—"}</Text>
        </Card>
        <Card className="flex flex-col gap-1">
          <Text as="span" variant="muted" className="text-xs uppercase tracking-wider">No Combat Data</Text>
          <Text as="span" className="text-2xl font-semibold text-white/50">{noDataEnemies.length}</Text>
          <Text as="span" variant="muted" className="text-xs">enemies</Text>
        </Card>
        <Card className="flex flex-col gap-1">
          <Text as="span" variant="muted" className="text-xs uppercase tracking-wider">Avg Damage</Text>
          <Text as="span" className="text-2xl font-semibold text-gold">{avgDmg.toFixed(1)}%</Text>
          <Text as="span" variant="muted" className="text-xs">combat enemies</Text>
        </Card>
        <Card className="flex flex-col gap-1">
          <Text as="span" variant="muted" className="text-xs uppercase tracking-wider">Max HP (Boss)</Text>
          <Text as="span" className="text-2xl font-semibold">
            {maxHpEnemy ? maxHpEnemy.hp.toLocaleString() : "—"}
          </Text>
          <Text as="span" variant="muted" className="text-xs">{maxHpEnemy?.n ?? "—"}</Text>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search enemy…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
        />
        {filterLabels.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "primary" : "ghost"}
            size="sm"
            aria-pressed={filter === key}
            onClick={() => handleFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Text variant="muted">
        Showing {filtered.length} of {ALL_ENEMIES.length}
        {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
      </Text>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <Th className="w-10 text-center">#</Th>
              <Th>Name</Th>
              <Th>
                <button className="flex items-center gap-1" onClick={() => handleSort("dpct")}>
                  Damage Output{sortArrow("dpct")}
                </button>
              </Th>
              <Th>Type</Th>
              <Th className="text-right">
                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("hp")}>
                  Max HP{sortArrow("hp")}
                </button>
              </Th>
              <Th className="text-right">
                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("def")}>
                  Defence{sortArrow("def")}
                </button>
              </Th>
              <Th className="text-right">
                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("mag")}>
                  Magery{sortArrow("mag")}
                </button>
              </Th>
              <Th className="text-right">
                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("spd")}>
                  Speed{sortArrow("spd")}
                </button>
              </Th>
              <Th className="text-right">
                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("hsp")}>
                  Hit Spd{sortArrow("hsp")}
                </button>
              </Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {slice.map((e, i) => {
              const rank = (currentPage - 1) * PER_PAGE + i + 1;
              const type = getType(e);
              const barPct = e.dpct !== null ? (e.dpct / MAX_PCT) * 100 : 0;
              const color = e.dpct !== null ? dmgColor(barPct) : null;

              return (
                <TableRow key={e.n}>
                  <Td className="text-center text-xs text-white/30">{rank}</Td>
                  <Td className="font-medium">{e.n}</Td>
                  <Td>
                    {e.dpct !== null ? (
                      <div className="flex min-w-[110px] items-center gap-2">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${Math.min(barPct, 100)}%`, backgroundColor: color ?? undefined }}
                          />
                        </div>
                        <span
                          className="w-10 text-right text-xs tabular-nums"
                          style={{ color: color ?? undefined }}
                        >
                          {e.dpct.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <Text as="span" variant="muted" className="text-xs">—</Text>
                    )}
                  </Td>
                  <Td>
                    {type === "melee"   && <Badge variant="error">Melee</Badge>}
                    {type === "archery" && <Badge variant="accent">Archery</Badge>}
                    {type === "both"    && <Badge variant="accent">Both</Badge>}
                    {type === "magic"   && <Badge className="bg-violet-500/15 text-violet-400">Magic</Badge>}
                    {type === "none"    && <Badge>—</Badge>}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {e.hp ? e.hp.toLocaleString() : <span className="text-white/25">—</span>}
                  </Td>
                  <Td className={`text-right tabular-nums ${e.def > 0 ? "text-green-400" : e.def < 0 ? "text-ember" : "text-white/25"}`}>
                    {e.def !== 0 ? numSign(e.def) : "—"}
                  </Td>
                  <Td className={`text-right tabular-nums ${e.mag > 0 ? "text-green-400" : e.mag < 0 ? "text-ember" : "text-white/25"}`}>
                    {e.mag !== 0 ? numSign(e.mag) : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {e.spd ? e.spd.toLocaleString() : <span className="text-white/25">—</span>}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {e.hsp !== 1
                      ? <span className={e.hsp > 1 ? "text-ember" : "text-white/40"}>{e.hsp}×</span>
                      : <span className="text-white/30">1×</span>}
                  </Td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
            ← Prev
          </Button>
          <Text as="span" variant="muted" className="text-sm">{currentPage} / {totalPages}</Text>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
            Next →
          </Button>
        </div>
      )}
    </Flow>
  );
}
