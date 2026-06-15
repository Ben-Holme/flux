"use client";

import { useState } from "react";
import EVENT_TYPES from "./event-types";
import { parseSpecial, formatDate } from "./utils";
import Stat from "./stat";
import ItemDisplay from "./item-display";
import PlayerDisplay from "./player-display";
import type { StoryEvent } from "./use-story-events";

interface Props {
  event: StoryEvent;
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
}

function SpecialDisclosure({
  sp,
  hasBody,
  exclude = [],
}: {
  sp: Record<string, string | true>;
  hasBody: boolean;
  exclude?: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: hasBody ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          width: "100%", padding: "10px 18px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,0.28)" }}>
          Special
        </span>
        <span style={{
          marginLeft: "auto", fontSize: "0.6rem", color: "rgba(255,255,255,0.28)",
          transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", display: "inline-block",
        }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 10px" }}>
          {Object.entries(sp).filter(([key]) => !exclude.includes(key)).map(([key, val]) => (
            <div key={key} style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.7, wordBreak: "break-all" }}>
              <span style={{ color: "rgba(255,255,255,0.22)" }}>{key}</span>
              {val !== true && <>: <span style={{ color: "rgba(255,255,255,0.5)" }}>{val}</span></>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventCard({ event, players, items }: Props) {
  const displayType = (event.type === "seasonContext" || event.type === "seasonSummary") ? "season" : event.type;
  const cfg    = EVENT_TYPES[displayType] || { label: event.type, symbol: "○", color: "#888" };
  const sp     = parseSpecial(event.special);
  const player = players[event.primary_char] ?? { name: `#${event.primary_char}` };
  const itemName = event.item ? (items[event.item] ?? `item #${event.item}`) : null;

  const hasBody = (
    event.type === "trip" ||
    event.type === "seasonContext" ||
    event.type === "seasonSummary" ||
    event.type === "introStory" ||
    (event.type === "tome"     && (sp.type || sp.lvl)) ||
    (event.type === "ench"     && (sp.type || sp.lvl)) ||
    (event.type === "owch"     && (itemName || (sp.context && sp.context !== "0"))) ||
    (event.type === "minigame" && sp.skill)
  );

  return (
    <div style={{
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(14px)",
      borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)",
      borderLeft: `3px solid ${cfg.color}`, marginBottom: "10px", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "11px 18px", display: "flex", alignItems: "center", gap: "10px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", letterSpacing: ".18em", textTransform: "uppercase", color: cfg.color }}>
          {event.type}
        </span>
        <span style={{ color: "rgba(255,255,255,0.22)", fontSize: "0.72rem", marginLeft: "auto" }}>{event.location}</span>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.72rem" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.22)", fontSize: "0.72rem" }}>{formatDate(event.date)}</span>
        {(event.story_points ?? 0) > 0 && (
          <>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.72rem" }}>·</span>
            <span style={{ color: "#c8923a", fontSize: "0.68rem", opacity: 0.65 }}>{event.story_points} sp</span>
          </>
        )}
      </div>

      {/* Player */}
      {event.primary_char !== 0 && (
        <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <PlayerDisplay player={player} />
        </div>
      )}

      {/* Body */}
      {hasBody && (
        <div style={{ padding: "14px 18px" }}>
          {event.type === "trip" && (
            <>
              {sp.openai && (
                <p style={{ margin: "0 0 14px", lineHeight: 1.75, color: "rgba(255,255,255,0.72)", fontStyle: "italic" }}>
                  &ldquo;{sp.openai}&rdquo;
                </p>
              )}
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                {sp.distance        && <Stat label="Distance"   value={`${Number(sp.distance).toLocaleString()} m`} />}
                {sp.duration        && <Stat label="Duration"   value={`${sp.duration} min`} />}
                {sp.kills           && <Stat label="Kills"      value={sp.kills as string} />}
                {sp.antaName        && <Stat label="Target"     value={sp.antaName as string} color="#e1a965" />}
                {sp.conflictLocationID && <Stat label="Battle site" value={sp.conflictLocationID as string} />}
                {sp.underground !== undefined && <Stat label="Terrain" value="Underground" />}
              </div>
            </>
          )}

          {event.type === "seasonContext" && (
            <>
              {sp.seasoncontext && (
                <p style={{ margin: "0 0 16px", lineHeight: 1.75, color: "rgba(255,255,255,0.82)" }}>
                  {sp.seasoncontext as string}
                </p>
              )}
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {Object.entries(sp)
                  .filter(([k, v]) => k !== "seasoncontext" && v !== true)
                  .map(([k, v]) => <Stat key={k} label={k} value={v as string} />)}
              </div>
            </>
          )}

          {event.type === "seasonSummary" && (
            <>
              {sp.beginning && <p style={{ margin: "0 0 16px", lineHeight: 1.75, color: "rgba(255,255,255,0.82)" }}>{sp.beginning as string}</p>}
              {sp.middle    && <p style={{ margin: "0 0 16px", lineHeight: 1.75, color: "rgba(255,255,255,0.82)" }}>{sp.middle as string}</p>}
              {sp.end       && <p style={{ margin: "0 0 16px", lineHeight: 1.75, color: "rgba(255,255,255,0.82)" }}>{sp.end as string}</p>}
            </>
          )}

          {event.type === "introStory" && (
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
              {sp.house ? `House ${sp.house as string}` : "Origin story"}
              {sp.openaierror ? " — narrative pending" : ""}
            </p>
          )}

          {(event.type === "tome" || event.type === "ench") && (
            <div style={{ display: "flex", gap: "24px" }}>
              {sp.type && <Stat label="Type"  value={sp.type as string} />}
              {sp.lvl  && <Stat label="Level" value={sp.lvl as string} />}
            </div>
          )}

          {event.type === "owch" && (
            <div>
              {itemName && <ItemDisplay itemStr={itemName as string} />}
              {sp.context && sp.context !== "0" && (
                <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>
                  {sp.context as string}
                </p>
              )}
            </div>
          )}

          {event.type === "minigame" && sp.skill && (
            <Stat label="Skill" value={sp.skill as string} />
          )}
        </div>
      )}

      <SpecialDisclosure
        sp={sp}
        hasBody={!!hasBody}
        exclude={event.type === "seasonContext" ? ["seasoncontext"] : []}
      />
    </div>
  );
}
