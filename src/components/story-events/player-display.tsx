"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { itemAccentColor } from "./utils";
import { Portrait } from "@/components/portrait";

interface Player {
  name?: string;
  color?: string;
  rgba?: string;
  colour?: string;
  [key: string]: unknown;
}

function parsePlayerName(raw: string) {
  if (!raw || !raw.includes("#")) return { name: raw, house: null, cls: null };
  const parts = raw.split("#").filter((p) => p && !p.startsWith("//"));
  return {
    name: parts[0] || raw,
    house: parts[1] || null,
    cls: parts[2] || null,
  };
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const r = Math.abs((hash >> 16) & 0x7f) + 80;
  const g = Math.abs((hash >> 8)  & 0x7f) + 80;
  const b = Math.abs((hash >> 0)  & 0x7f) + 80;
  return `${r},${g},${b}`;
}

function playerColor(player: Player): string {
  const rgba = player.color ?? player.rgba ?? player.colour;
  if (rgba && typeof rgba === "string" && rgba.includes(",")) return itemAccentColor(rgba);
  return nameToColor(player.name ?? "");
}

export default function PlayerDisplay({ player, charId }: { player: Player; charId?: number }) {
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  if (!player?.name) return null;

  const parsed  = parsePlayerName(player.name);
  const c       = playerColor({ ...player, name: parsed.name });
  const summary = player.name.split("#").at(-2) || null;
  const season  = player.name.split("#").at(-1) || null;

  function showTooltip() {
    if (!summary || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setTooltipPos({ top: rect.top + window.scrollY - 8, left: rect.left + window.scrollX, width: Math.max(rect.width, 320) });
  }

  return (
    <>
      <div
        ref={anchorRef}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTooltipPos(null)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid rgba(${c},0.27)`,
          borderLeft: `3px solid rgba(${c},1)`,
          borderRadius: "6px",
          padding: "8px 14px",
        }}
      >
        {charId != null
          ? <Portrait charId={charId} name={parsed.name} size={28} />
          : (
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: `rgba(${c},0.13)`, border: `1px solid rgba(${c},0.4)`,
              boxShadow: `0 0 10px rgba(${c},0.33)`, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", color: `rgba(${c},0.9)`, fontFamily: "var(--font-heading)",
            }}>
              {parsed.name[0]?.toUpperCase()}
            </div>
          )
        }
        <div>
          <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}>
            {parsed.name}
          </div>
          {(parsed.house || parsed.cls) && (
            <div style={{ display: "flex", gap: "8px", marginTop: "3px" }}>
              {parsed.house && <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.3)" }}>{parsed.house}</span>}
              {parsed.cls   && <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.2)" }}>{parsed.cls}</span>}
            </div>
          )}
        </div>
        {summary && <span style={{ fontSize: "0.6rem", color: `rgba(${c},0.5)`, marginLeft: "4px" }}>?</span>}
      </div>

      {tooltipPos && summary && createPortal(
        <div
          onMouseEnter={showTooltip}
          onMouseLeave={() => setTooltipPos(null)}
          style={{
            position: "absolute",
            top: tooltipPos.top, left: tooltipPos.left,
            transform: "translateY(-100%)",
            zIndex: 9999,
            background: "rgba(8,8,8,0.97)",
            backdropFilter: "blur(20px)",
            border: `1px solid rgba(${c},0.35)`,
            borderRadius: "8px",
            padding: "14px 18px",
            width: `${tooltipPos.width}px`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(${c},0.12)`,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".12em", color: `rgba(${c},0.6)`, marginBottom: "8px" }}>
            {season}
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.75, color: "rgba(255,255,255,0.72)" }}>
            {summary}
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
