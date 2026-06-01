"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function CharacterPage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const charId = Number(params.id);

  const [char, setChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push(`/login?redirect=/my-unyha/${charId}`);
      return;
    }
    fetch("https://api.unyhagame.com/ueserv/getMyAccount-w.php", {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        const found = (data.characters as Character[]).find((c) => c.id === charId);
        if (!found) throw new Error("Character not found");
        setChar(found);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, router, charId]);

  if (!session) return null;

  const displayName = char ? char.name.split("#")[0] : "";

  return (
    <PlainPage className="pt-[120px] !pb-20">
      <div className="flex items-center justify-between">
        <Link href="/my-unyha" className="text-[0.78rem] tracking-[0.08em] text-white/35 no-underline">
          ← My Unyha
        </Link>
        <button
          onClick={logout}
          className="cursor-pointer rounded border border-white/10 bg-transparent px-[10px] py-1 font-heading text-[0.62rem] uppercase tracking-[0.12em] text-white/35"
        >
          Sign Out
        </button>
      </div>

      {loading && <p className="mt-8">Loading…</p>}
      {error && <p className="mt-8 text-[#e16565]">Error: {error}</p>}

      {char && (
        <>
          <div className="mt-6">
            <div
              className="font-heading text-base uppercase tracking-[0.2em] text-[#ffd98f]"
              style={{ textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px" }}
            >
              Character
            </div>
            <h1>{displayName}</h1>
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
