"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import { Portrait } from "@/components/portrait";
import {
  Badge,
  Card,
  Eyebrow,
  Flow,
  Heading,
  Table,
  TableBody,
  TableRow,
  Td,
  Text,
} from "@/components/ui";
import { cn } from "@/lib/cn";

interface Character {
  id: number;
  name: string;
  data: string;
  tamed: number;
  privilege: number;
  fame: number;
  melee: number;
  defense: number;
  healing: number;
  archery: number;
  taming: number;
  huntercraft: number;
  alchemy: number;
  magery: number;
  meditation: number;
  hiding: number;
  poisoning: number;
  stealth: number;
  blacksmithing: number;
  lumberjacking: number;
  arms_lore: number;
  tailoring: number;
  herbalism: number;
  mining: number;
  woodworking: number;
  storyweaving: number;
}

interface AccountData {
  email: string;
  house: string;
  steam_id: string | null;
  characters: Character[];
}

const SKILL_LABELS: Record<string, string> = {
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

const SKILL_KEYS = Object.keys(SKILL_LABELS) as (keyof Character)[];

// Raw skill values arrive as "419.929871:0" — value before ":"; suffix ignored.
function skillValue(raw: unknown): number {
  return (parseFloat(String(raw)) || 0) * 0.1;
}

// The `data` field is a string of "#key:value" pairs. Values may contain ":".
function parseData(data: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const seg of (data ?? "").split("#")) {
    if (!seg) continue;
    const i = seg.indexOf(":");
    if (i === -1) out[seg] = "";
    else out[seg.slice(0, i)] = seg.slice(i + 1);
  }
  return out;
}

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// `profile` holds bio paragraphs (split by §) then character quotes (split by @).
function parseProfile(profile: string): { paragraphs: string[]; quotes: string[] } {
  if (!profile) return { paragraphs: [], quotes: [] };
  const at = profile.indexOf("@");
  const bio = at === -1 ? profile : profile.slice(0, at);
  const rest = at === -1 ? "" : profile.slice(at + 1);
  return {
    paragraphs: bio
      .split("§")
      .map((p) => p.trim())
      .filter(Boolean),
    quotes: rest
      .split("@")
      .map((q) => q.trim())
      .filter(Boolean),
  };
}

// e.g. "Brimmar@Tann@Midaen@/savedHomes" → ["Brimmar", "Tann", "Midaen"]
function parseList(raw: string): string[] {
  return (raw ?? "")
    .split("@")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("/"));
}

function AccountContent() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const charParam = searchParams.get("char");
  const activeCharId = charParam ? Number(charParam) : null;

  const steamParam = searchParams.get("steam");

  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      const redirect = activeCharId ? `/account?char=${activeCharId}` : "/account";
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    fetch("https://api.unyhagame.com/ueserv/getMyAccount-w.php", {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        setAccount(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, router, activeCharId]);

  if (!session) return null;

  const activeChar =
    account && activeCharId
      ? (account.characters.find((c) => c.id === activeCharId) ?? null)
      : null;

  return (
    <Flow className="mx-auto min-h-[90vh] max-w-[800px] px-6 pt-[120px] pb-20">
      {/* Header row */}
      <div className="flex items-center justify-between">
        {activeChar ? (
          <Link
            href="/account"
            className="text-[0.78rem] tracking-[0.08em] text-white/35 no-underline"
          >
            ← My Account
          </Link>
        ) : (
          <Eyebrow>My Account</Eyebrow>
        )}
        <Button onClick={logout} variant="ghost">
          Sign Out
        </Button>
      </div>

      {steamParam === "linked" && (
        <Text className="text-[#7ecf7e]">Steam account linked successfully.</Text>
      )}
      {steamParam === "error" && (
        <Text className="text-ember">Steam linking failed. Please try again.</Text>
      )}

      {loading && <Text>Loading…</Text>}
      {error && <Text className="text-ember">Error: {error}</Text>}

      {/* Character detail view */}
      {account && activeChar && <CharacterDetail char={activeChar} />}

      {/* Account overview */}
      {account && !activeCharId && (
        <>
          <Heading level="h1">Account</Heading>
          <Table>
            <TableBody>
              <TableRow>
                <Td variant="heading">Email</Td>
                <Td className="text-right">{account.email}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">House</Td>
                <Td className="text-right">{account.house || "—"}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Steam</Td>
                <Td className="text-right">
                  {account.steam_id ? (
                    <Text as="span" variant="muted">
                      Linked ({account.steam_id})
                    </Text>
                  ) : (
                    <Button
                      href={`https://api.unyhagame.com/ueserv/steam-link-start.php?sk=${session.sessionkey}`}
                      external
                      variant="ghost"
                      size="sm"
                    >
                      Connect Steam
                    </Button>
                  )}
                </Td>
              </TableRow>
            </TableBody>
          </Table>

          <ChangePassword sessionkey={session.sessionkey} />

          {account.characters.length > 0 && (
            <>
              <Heading level="h2">Characters</Heading>
              {account.characters.map((char) => (
                <CharacterCard key={char.id} char={char} />
              ))}
            </>
          )}
        </>
      )}

      {/* charParam set but character not found */}
      {account && activeCharId && !activeChar && !loading && (
        <Text className="text-white/35">Character not found.</Text>
      )}
    </Flow>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}

function CharacterCard({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];
  const d = parseData(char.data);
  const subtitle = [d.class && d.class !== "none" ? titleCase(d.class) : null, d.home]
    .filter(Boolean)
    .join(" · ");
  // Notable skills only (> 10), value computed once.
  const skills = SKILL_KEYS.map((k) => ({ k, val: skillValue(char[k]) })).filter(
    ({ val }) => val > 10,
  );

  return (
    <Link href={`/account?char=${char.id}`}>
      <Card className="flex items-start gap-5">
        <Portrait charId={char.id} name={displayName} size={64} />
        <Flow className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <Heading level="h4" as="span">
              {displayName}
            </Heading>
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

function CharacterDetail({ char }: { char: Character }) {
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
        <Text variant="muted" className="italic">
          {d.titleSummary}
        </Text>
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
          {paragraphs.map((p, i) => (
            <Text key={"profile" + i}>{p}</Text>
          ))}
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
              “{q}”
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

const inputClass =
  "mt-1.5 block w-full rounded-[6px] border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white/85 outline-none";
const labelClass =
  "block text-[0.62rem] uppercase tracking-[0.12em] text-white/35 mb-0.5";

function ChangePassword({ sessionkey }: { sessionkey: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  function toggle() {
    setOpen((v) => !v);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/changePassword-w.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionkey}`,
        },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setSuccess(true);
      setOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Heading level="h2">Password</Heading>
        <Button variant="ghost" size="sm" onClick={toggle}>
          {open ? "Cancel" : "Change"}
        </Button>
      </div>

      {success && !open && (
        <Text className="text-[#7ecf7e]">Password changed successfully.</Text>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <input
              ref={firstField}
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>
          {error && (
            <Text as="p" className="mt-0 text-[0.85rem] text-ember">{error}</Text>
          )}
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
