"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

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
    <div className="plain-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "120px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/my-unyha" style={{
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: ".08em",
          textDecoration: "none",
        }}>
          ← My Unyha
        </Link>
        <button
          onClick={logout}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.62rem",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>

      {loading && <p style={{ marginTop: "32px" }}>Loading…</p>}
      {error && <p style={{ marginTop: "32px", color: "#e16565" }}>Error: {error}</p>}

      {char && (
        <>
          <div style={{ marginTop: "24px" }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#ffd98f",
              textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
            }}>
              Character
            </div>
            <h1>{displayName}</h1>
          </div>

          <div style={{
            marginTop: "28px",
            padding: "20px 24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
          }}>
            <InfoRow label="Fame" value={String(char.fame)} last />
          </div>

          <h2 style={{ marginTop: "48px" }}>Skills</h2>
          <div style={{
            marginTop: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "2px",
          }}>
            {SKILL_KEYS.map((k) => {
              const val = char[k] as number;
              return (
                <div key={k} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: val > 0 ? "rgba(255,255,255,0.04)" : "transparent",
                  borderRadius: "3px",
                }}>
                  <span style={{
                    fontSize: "0.78rem",
                    letterSpacing: ".06em",
                    color: val > 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)",
                  }}>
                    {SKILL_LABELS[k as string]}
                  </span>
                  <span style={{
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-heading)",
                    color: val > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.18)",
                  }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex",
      gap: "16px",
      padding: "8px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{ minWidth: "72px", color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", letterSpacing: ".08em" }}>
        {label}
      </span>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem" }}>{value}</span>
    </div>
  );
}
