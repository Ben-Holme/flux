"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import { Portrait } from "@/components/portrait";
import {
  Alert,
  Badge,
  Card,
  Checkbox,
  Eyebrow,
  Flow,
  FormLabel,
  Heading,
  Input,
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
  approved: boolean;
  is_admin: boolean;
  playstyle: 1 | 2 | null;
  achievements: Record<string, number>;
  spirit_xp: number;
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
  const steamReason = searchParams.get("reason");

  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [playstylePending, setPlaystylePending] = useState(false);
  const [playstyleOpen, setPlaystyleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const setPlaystyle = async (value: 1 | 2) => {
    if (!session || !account) return;
    setPlaystylePending(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/set-playstyle-w.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionkey}`,
        },
        body: JSON.stringify({ playstyle: value }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setAccount((prev) => prev ? {
        ...prev,
        playstyle: value,
        achievements: data.achievements ?? prev.achievements,
        spirit_xp: data.spirit_xp ?? prev.spirit_xp,
      } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPlaystylePending(false);
    }
  };

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
        <Alert variant="success">Steam account linked successfully.</Alert>
      )}
      {steamParam === "error" && (
        <Alert>
          {steamReason === "steam_already_linked"
            ? "That Steam account is already linked to a different Unyha account."
            : steamReason === "steam_verification_failed"
              ? "Steam couldn't verify your identity. Please try again."
              : steamReason === "invalid_session" || steamReason === "missing_session"
                ? "Your session expired. Please sign in again and retry."
                : "Steam linking failed. Please try again."}
        </Alert>
      )}

      {loading && <Text>Loading…</Text>}
      {error && <Alert>Error: {error}</Alert>}

      {/* Character detail view */}
      {account && activeChar && <CharacterDetail char={activeChar} />}

      {/* Account overview */}
      {account && !activeCharId && (
        <>
          <Heading level="h1">Account</Heading>
          {account.is_admin && (
            <Link href="/admin" className="text-xs text-white/40 hover:text-white/70 font-mono">
              /admin
            </Link>
          )}
          <pre className="text-xs text-white/40 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(account.achievements, null, 2)}
          </pre>
          <Table>
            <TableBody>
              <TableRow>
                <Td variant="heading">Email</Td>
                <Td className="text-right">{account.email}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Password</Td>
                <Td className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPasswordOpen(true)}
                  >
                    Change
                  </Button>
                </Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">House</Td>
                <Td className="text-right">{account.house || "—"}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Spirit XP</Td>
                <Td className="text-right">{account.spirit_xp}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Steam</Td>
                <Td className="text-right">
                  {account.steam_id ? (
                    <Badge variant="success">Linked</Badge>
                  ) : (
                    <Button
                      href={`https://api.unyhagame.com/ueserv/steam-link-start.php?sk=${session.sessionkey}`}
                      external
                      variant="secondary"
                      size="sm"
                    >
                      Connect Steam
                    </Button>
                  )}
                </Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Player style</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    {account.playstyle === 1 ? (
                      <Badge variant="success">Active</Badge>
                    ) : account.playstyle === 2 ? (
                      <Badge variant="warning">Idle</Badge>
                    ) : (
                      <Text as="span" variant="muted">Unset</Text>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => setPlaystyleOpen(true)}>
                      Edit
                    </Button>
                  </div>
                </Td>
              </TableRow>
            </TableBody>
          </Table>

          {!account.approved && (
            <Card>
              <Flow>
                <Heading level="h3">In queue</Heading>
                <Text>
                  We&apos;re opening the world of Unyha in waves. When it&apos;s your turn,
                  you&apos;ll hear from us at <strong>{account.email}</strong>.
                </Text>
                <Text>
                  In the meantime — arm yourself.{" "}
                  <Link href="/wiki" className="text-white underline underline-offset-2 hover:text-white/70">
                    The wiki
                  </Link>{" "}
                  covers the lore, the world, and what to expect when your call comes.
                </Text>
              </Flow>
            </Card>
          )}

          {account.characters.length > 0 && (
            <>
              <Heading level="h2">Characters</Heading>
              {account.characters.map((char) => (
                <CharacterCard key={char.id} char={char} />
              ))}
            </>
          )}

          <div className="border-t border-white/[0.06] pt-6">
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete Account
            </Button>
          </div>

          {passwordOpen && (
            <ChangePasswordModal
              sessionkey={session.sessionkey}
              onClose={() => setPasswordOpen(false)}
            />
          )}

          {playstyleOpen && (
            <PlayerTypeModal
              value={account.playstyle}
              pending={playstylePending}
              onSelect={(v) => { setPlaystyle(v); setPlaystyleOpen(false); }}
              onClose={() => setPlaystyleOpen(false)}
            />
          )}

          {deleteOpen && (
            <DeleteAccountModal
              sessionkey={session.sessionkey}
              onClose={() => setDeleteOpen(false)}
            />
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


function PlayerTypeModal({
  value,
  pending,
  onSelect,
  onClose,
}: {
  value: 1 | 2 | null;
  pending: boolean;
  onSelect: (v: 1 | 2) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-full max-w-md flex-col gap-6 rounded-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Flow>
          <Heading level="h3">Player style</Heading>
          <Text>
            Are you ready for the full early access experience, and lead the
            spiritfolk to glory? Or do you want to follow the action from the
            sidelines for now?
          </Text>
        </Flow>
        <div className="flex gap-3">
          <Button
            variant={value === 2 ? "primary" : "ghost"}
            disabled={pending}
            onClick={() => onSelect(2)}
          >
            Idle
          </Button>
          <Button
            variant={value === 1 ? "primary" : "ghost"}
            disabled={pending}
            onClick={() => onSelect(1)}
          >
            Active
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({
  sessionkey,
  onClose,
}: {
  sessionkey: string;
  onClose: () => void;
}) {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/delete-account-w.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionkey}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      logout();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-full max-w-md flex-col gap-5 rounded-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Flow>
          <Heading level="h3">Delete Account</Heading>
          <Text>
            This permanently deletes your account, characters, and all associated data.
            This cannot be undone.
          </Text>
        </Flow>
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <div>
            <FormLabel>Confirm your password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5"
              autoFocus
            />
          </div>
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            label="I understand this is permanent and cannot be undone"
          />
          {error && <Alert>{error}</Alert>}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="ghost"
              disabled={loading || !confirmed || !password}
            >
              {loading ? "Deleting…" : "Delete my account"}
            </Button>
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({
  sessionkey,
  onClose,
}: {
  sessionkey: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-full max-w-md flex-col gap-6 rounded-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading level="h3">Change Password</Heading>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FormLabel>Current Password</FormLabel>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5"
              autoFocus
            />
          </div>
          <div>
            <FormLabel>New Password</FormLabel>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <FormLabel>Confirm New Password</FormLabel>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className="mt-1.5"
            />
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Password"}
            </Button>
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
