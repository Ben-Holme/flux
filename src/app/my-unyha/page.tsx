"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    <div className="plain-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "120px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#ffd98f",
          textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
        }}>
          My Unyha
        </div>
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
      <h1>Account</h1>

      {loading && <p style={{ marginTop: "32px" }}>Loading…</p>}
      {error && <p style={{ marginTop: "32px", color: "#e16565" }}>Error: {error}</p>}

      {account && (
        <>
          <div style={{
            marginTop: "28px",
            padding: "20px 24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
          }}>
            <InfoRow label="Email" value={account.email} />
            <InfoRow label="House" value={account.house || "—"} last />
          </div>

          {account.characters.length > 0 && (
            <>
              <h2 style={{ marginTop: "48px" }}>Characters</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {account.characters.map((char) => (
                  <CharacterCard key={char.id} char={char} />
                ))}
              </div>
            </>
          )}
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

function CharacterCard({ char }: { char: Character }) {
  const displayName = char.name.split("#")[0];
  const skills = SKILL_KEYS.filter((k) => (char[k] as number) > 0);

  return (
    <div style={{
      padding: "20px 24px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "6px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: skills.length > 0 ? "16px" : 0,
      }}>
        <span style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.1rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.9)",
        }}>
          {displayName}
        </span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", letterSpacing: ".06em" }}>
          Fame {char.fame}
        </span>
      </div>
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {skills.map((k) => (
            <div key={k} style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "3px",
              padding: "3px 8px",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: ".06em",
            }}>
              <span style={{ color: "rgba(255,255,255,0.3)", marginRight: "6px" }}>
                {SKILL_LABELS[k as string]}
              </span>
              {char[k]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
