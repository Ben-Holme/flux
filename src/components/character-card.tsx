import Link from "next/link";
import { Badge, Card, Eyebrow, Flow, Heading, Table, TableBody, TableRow, Td, Text } from "@/components/ui";
import { Portrait } from "@/components/portrait";
import { cn } from "@/lib/cn";
import type { Character } from "@/app/account/account-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

export const SKILL_LABELS: Record<string, string> = {
  melee: "Melee",
  defense: "Defense",
  healing: "Healing",
  archery: "Archery",
  taming: "Taming",
  huntercraft: "Huntercraft",
  alchemy: "Alchemy",
  magery: "Magery",
  meditation: "Meditation",
  hiding: "Hiding",
  poisoning: "Poisoning",
  stealth: "Stealth",
  blacksmithing: "Blacksmithing",
  lumberjacking: "Lumberjacking",
  arms_lore: "Arms Lore",
  tailoring: "Tailoring",
  herbalism: "Herbalism",
  mining: "Mining",
  woodworking: "Woodworking",
  storyweaving: "Storyweaving",
};

export const SKILL_KEYS = Object.keys(SKILL_LABELS) as (keyof Character)[];

/** Raw skill values arrive as "419.929871:0" — value before ":" × 0.1. */
export function skillValue(raw: unknown): number {
  return (parseFloat(String(raw)) || 0) * 0.1;
}

/** `data` field: "#key:value" pairs. Values may contain ":". */
export function parseData(data: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const seg of (data ?? "").split("#")) {
    if (!seg) continue;
    const i = seg.indexOf(":");
    if (i === -1) out[seg] = "";
    else out[seg.slice(0, i)] = seg.slice(i + 1);
  }
  return out;
}

/** `profile` holds bio paragraphs (split by §) then character quotes (split by @). */
export function parseProfile(profile: string): { paragraphs: string[]; quotes: string[] } {
  if (!profile) return { paragraphs: [], quotes: [] };
  const at = profile.indexOf("@");
  const bio = at === -1 ? profile : profile.slice(0, at);
  const rest = at === -1 ? "" : profile.slice(at + 1);
  return {
    paragraphs: bio.split("§").map((p) => p.trim()).filter(Boolean),
    quotes: rest.split("@").map((q) => q.trim()).filter(Boolean),
  };
}

/** e.g. "Brimmar@Tann@Midaen@/savedHomes" → ["Brimmar", "Tann", "Midaen"] */
export function parseList(raw: string): string[] {
  return (raw ?? "").split("@").map((s) => s.trim()).filter((s) => s && !s.startsWith("/"));
}

export const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ── CharacterCard ─────────────────────────────────────────────────────────────

export function CharacterCard({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];
  const d = parseData(char.data);
  const subtitle = [d.class && d.class !== "none" ? titleCase(d.class) : null, d.home]
    .filter(Boolean)
    .join(" · ");
  const skills = SKILL_KEYS.map((k) => ({ k, val: skillValue(char[k]) })).filter(({ val }) => val > 10);

  return (
    <Link href={`/account/characters?char=${char.id}`}>
      <Card className="flex items-start gap-5">
        <Portrait charId={char.id} name={displayName} size={64} />
        <Flow className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <Heading level="h4" as="span">{displayName}</Heading>
            <span className="text-[0.75rem] tracking-[0.06em] text-white/35">Fame {char.fame}</span>
          </div>
          {subtitle && <Text className="mt-0">{subtitle}</Text>}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.map(({ k, val }) => (
                <Badge key={k}>
                  <span className="pr-2">{SKILL_LABELS[k as string]}</span>
                  {val.toFixed(1)}
                </Badge>
              ))}
            </div>
          )}
        </Flow>
      </Card>
    </Link>
  );
}

// ── CharacterDetail ───────────────────────────────────────────────────────────

export function CharacterDetail({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];
  const d = parseData(char.data);
  const { paragraphs, quotes } = parseProfile(d.profile);
  const savedHomes = parseList(d.savedHomes);

  const info: [string, string][] = [
    d.class && d.class !== "none" ? ["Class", titleCase(d.class)] : null,
    d.house ? ["House", d.house] : null,
    d.home ? ["Home", d.home] : null,
    d.season ? ["Season", titleCase(d.season)] : null,
    ["Fame", String(char.fame)],
    d.peakFame ? ["Peak Fame", d.peakFame] : null,
    d.legacy ? ["Legacy", d.legacy] : null,
    savedHomes.length ? ["Saved Homes", savedHomes.join(", ")] : null,
  ].filter((row): row is [string, string] => row !== null);

  return (
    <Flow>
      <div className="flex items-center gap-6">
        <Portrait charId={char.id} name={displayName} size={128} />
        <div>
          <Eyebrow>{d.class && d.class !== "none" ? titleCase(d.class) : "Character"}</Eyebrow>
          <Heading level="h1">{displayName}</Heading>
        </div>
      </div>

      {d.titleSummary && (
        <Text variant="muted" className="italic">{d.titleSummary}</Text>
      )}

      <Table>
        <TableBody>
          {info.map(([label, value]) => (
            <TableRow key={label}>
              <Td variant="heading">{label}</Td>
              <Td className="text-right">{value}</Td>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paragraphs.length > 0 && (
        <>
          <Heading level="h2">Profile</Heading>
          {paragraphs.map((p, i) => <Text key={"profile" + i}>{p}</Text>)}
        </>
      )}

      {quotes.length > 0 && (
        <div className="flex flex-col gap-3">
          {quotes.map((q, i) => (
            <Text
              key={"quote" + i}
              as="p"
              className="border-gold border-l-2 pl-4 text-white/70 italic"
            >
              &ldquo;{q}&rdquo;
            </Text>
          ))}
        </div>
      )}

      <Heading level="h2">Skills</Heading>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          SKILL_KEYS.slice(0, Math.ceil(SKILL_KEYS.length / 2)),
          SKILL_KEYS.slice(Math.ceil(SKILL_KEYS.length / 2)),
        ].map((group, i) => (
          <Table key={i}>
            <TableBody>
              {group.map((k) => {
                const val = skillValue(char[k]);
                return (
                  <TableRow key={k}>
                    <Td variant="heading" className={val === 0 ? "text-white/20" : "text-white"}>
                      {SKILL_LABELS[k as string]}
                    </Td>
                    <Td className={cn("text-right", val === 0 && "text-white/20")}>
                      {val.toFixed(1)}
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ))}
      </div>
    </Flow>
  );
}
