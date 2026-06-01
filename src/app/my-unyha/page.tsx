"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function MyUnyhaPage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/login?redirect=/my-unyha");
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
  }, [session, router]);

  if (!session) return null;

  return (
    <PlainPage className="pt-[120px] !pb-20">
      <div className="flex items-center justify-between">
        <div
          className="font-heading text-base uppercase tracking-[0.2em] text-[#ffd98f]"
          style={{ textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px" }}
        >
          My Unyha
        </div>
        <button
          onClick={logout}
          className="cursor-pointer rounded border border-white/10 bg-transparent px-[10px] py-1 font-heading text-[0.62rem] uppercase tracking-[0.12em] text-white/35"
        >
          Sign Out
        </button>
      </div>
      <h1>Account</h1>

      {loading && <p className="mt-8">Loading…</p>}
      {error && <p className="mt-8 text-[#e16565]">Error: {error}</p>}

      {account && (
        <>
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
    </PlainPage>
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

function CharacterCard({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];
  const skills = SKILL_KEYS.filter((k) => (char[k] as number) > 0);

  return (
    <div className="rounded-[6px] border border-white/[0.08] bg-white/[0.04] px-6 py-5">
      <div className={`flex items-baseline justify-between${skills.length > 0 ? " mb-4" : ""}`}>
        <Link
          href={`/my-unyha/${char.id}`}
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
  );
}
