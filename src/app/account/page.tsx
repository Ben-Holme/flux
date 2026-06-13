"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import PlainPage from "@/components/plain-page";

interface Character {
  id: number;
  name: string;
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

function AccountContent() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const charParam = searchParams.get("char");
  const activeCharId = charParam ? Number(charParam) : null;

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

  const activeChar = account && activeCharId
    ? account.characters.find((c) => c.id === activeCharId) ?? null
    : null;

  return (
    <PlainPage className="pt-[120px] !pb-20">
      {/* Header row */}
      <div className="flex items-center justify-between">
        {activeChar ? (
          <Link href="/account" className="text-[0.78rem] tracking-[0.08em] text-white/35 no-underline">
            ← My Account
          </Link>
        ) : (
          <div
            className="font-heading text-base uppercase tracking-[0.2em] text-[#c8923a]"
            style={{ textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px" }}
          >
            My Account
          </div>
        )}
        <button
          onClick={logout}
          className="cursor-pointer rounded border border-white/10 bg-transparent px-[10px] py-1 font-heading text-[0.62rem] uppercase tracking-[0.12em] text-white/35"
        >
          Sign Out
        </button>
      </div>

      {loading && <p className="mt-8">Loading…</p>}
      {error && <p className="mt-8 text-[#e16565]">Error: {error}</p>}

      {/* Character detail view */}
      {account && activeChar && <CharacterDetail char={activeChar} />}

      {/* Account overview */}
      {account && !activeCharId && (
        <>
          <h1>Account</h1>
          <div className="mt-7 rounded-[6px] border border-white/[0.08] bg-white/[0.04] px-6 py-5">
            <InfoRow label="Email" value={account.email} />
            <InfoRow label="House" value={account.house || "—"} last />
          </div>

          {account.characters.length > 0 && (
            <>
              <h2 className="mt-12">Characters</h2>
              <div className="mt-4 flex flex-col gap-4">
                {account.characters.map((char) => (
                  <CharacterCard key={char.id} char={char} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* charParam set but character not found */}
      {account && activeCharId && !activeChar && !loading && (
        <p className="mt-8 text-white/35">Character not found.</p>
      )}
    </PlainPage>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex gap-4 py-2${last ? "" : " border-b border-white/[0.05]"}`}>
      <span className="min-w-[72px] text-[0.78rem] tracking-[0.08em] text-white/35">{label}</span>
      <span className="text-[0.85rem] text-white/80">{value}</span>
    </div>
  );
}

function Portrait({ charId, name, size }: { charId: number; name: string; size: number }) {
  const initial = name[0]?.toUpperCase() ?? "?";
  const sharedStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "2px solid rgba(0,0,0,0.75)",
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <img
        src={`https://unyhagame.com/ueserr/chars/${charId}.png`}
        style={{ ...sharedStyle, width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.style.display = "none";
          const fallback = img.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        style={{
          ...sharedStyle,
          background: "#2a3d3e",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.85)",
          fontSize: Math.round(size * 0.375),
          fontWeight: 600,
          userSelect: "none",
        }}
      >
        {initial}
      </div>
    </div>
  );
}

function CharacterCard({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];
  const skills = SKILL_KEYS.filter((k) => (char[k] as number) > 0);

  return (
    <div className="flex items-start gap-5 rounded-[6px] border border-white/[0.08] bg-white/[0.04] px-6 py-5">
      <Portrait charId={char.id} name={displayName} size={64} />
      <div className="min-w-0 flex-1">
        <div className={`flex items-baseline justify-between${skills.length > 0 ? " mb-4" : ""}`}>
          <Link
            href={`/account?char=${char.id}`}
            className="font-heading text-[1.1rem] uppercase tracking-[0.15em] text-white/90 no-underline"
          >
            {displayName}
          </Link>
          <span className="text-[0.75rem] tracking-[0.06em] text-white/35">
            Fame {char.fame}
          </span>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((k) => (
              <div
                key={k}
                className="rounded-[3px] bg-white/[0.06] px-2 py-[3px] text-[0.72rem] tracking-[0.06em] text-white/55"
              >
                <span className="mr-1.5 text-white/30">{SKILL_LABELS[k as string]}</span>
                {char[k]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterDetail({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];

  return (
    <>
      <div className="mt-6 flex items-center gap-6">
        <Portrait charId={char.id} name={displayName} size={96} />
        <div>
          <div
            className="font-heading text-base uppercase tracking-[0.2em] text-[#c8923a]"
            style={{ textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px" }}
          >
            Character
          </div>
          <h1 className="mb-0">{displayName}</h1>
        </div>
      </div>

      <div className="mt-7 rounded-[6px] border border-white/[0.08] bg-white/[0.04] px-6 py-5">
        <InfoRow label="Fame" value={String(char.fame)} last />
      </div>

      <h2 className="mt-12">Skills</h2>
      <div className="mt-4 grid gap-0.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {SKILL_KEYS.map((k) => {
          const val = char[k] as number;
          return (
            <div
              key={k}
              className={`flex items-center justify-between rounded-[3px] px-3 py-2${val > 0 ? " bg-white/[0.04]" : ""}`}
            >
              <span className={`text-[0.78rem] tracking-[0.06em]${val > 0 ? " text-white/50" : " text-white/20"}`}>
                {SKILL_LABELS[k as string]}
              </span>
              <span className={`font-heading text-[0.85rem]${val > 0 ? " text-white/85" : " text-white/20"}`}>
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
