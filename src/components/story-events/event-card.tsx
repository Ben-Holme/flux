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
  onCharClick?: (charId: number) => void;
  onItemClick?: (itemId: string | number) => void;
  onLocClick?: (locName: string) => void;
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
    <div className={hasBody ? "border-t border-white/[0.05]" : undefined}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-1.5 border-none bg-transparent px-[18px] py-2.5 text-left"
      >
        <span className="text-[0.6rem] uppercase tracking-[0.12em] text-white/[0.28]">
          Special
        </span>
        <span
          className="ml-auto inline-block text-[0.6rem] text-white/[0.28] transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="px-[18px] pb-2.5">
          {Object.entries(sp)
            .filter(([key]) => !exclude.includes(key))
            .map(([key, val]) => (
              <div key={key} className="break-all text-[0.68rem] leading-[1.7] text-white/35">
                <span className="text-white/[0.22]">{key}</span>
                {val !== true && (
                  <>
                    : <span className="text-white/50">{val}</span>
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function EventCard({ event, players, items, onCharClick, onItemClick, onLocClick }: Props) {
  const displayType = (event.type === "seasonContext" || event.type === "seasonSummary") ? "season" : event.type;
  const cfg    = EVENT_TYPES[displayType] || { label: event.type, symbol: "○", color: "#888" };
  const sp     = parseSpecial(event.special);
  const player = players[event.primary_char] ?? { name: `#${event.primary_char}` };
  const itemName = event.item ? (items[event.item] ?? `item #${event.item}`) : null;
  const char2Id = event.char2 != null && event.char2 !== 0 ? Number(event.char2) : undefined;
  const char2 = char2Id != null ? (players[char2Id] ?? { name: `#${char2Id}` }) : null;

  const hasBody = (
    event.type === "trip" ||
    event.type === "seasonContext" ||
    event.type === "seasonSummary" ||
    event.type === "introStory" ||
    (event.type === "tome"     && (sp.type || sp.lvl)) ||
    (event.type === "ench"     && (sp.type || sp.lvl)) ||
    (event.type === "owch"     && (itemName || (sp.context && sp.context !== "0") || char2 != null)) ||
    (event.type === "minigame" && sp.skill)
  );

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-lg border border-white/[0.06] bg-black/70"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.05] px-[18px] py-[11px]">
        <span className="font-heading text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: cfg.color }}>
          {event.type}
        </span>
        <span
          className="ml-auto text-[0.72rem] text-white/[0.22]"
          style={{ cursor: onLocClick && event.location ? "pointer" : "default" }}
          onClick={() => event.location && onLocClick?.(event.location)}
        >
          {event.location}
        </span>
        <span className="text-[0.72rem] text-white/[0.15]">·</span>
        <span className="text-[0.72rem] text-white/[0.22]">{formatDate(event.date)}</span>
        {(event.story_points ?? 0) > 0 && (
          <>
            <span className="text-[0.72rem] text-white/[0.15]">·</span>
            <span className="text-[0.68rem] text-[#c8923a] opacity-65">{event.story_points} sp</span>
          </>
        )}
      </div>

      {/* Player */}
      {event.primary_char !== 0 && (
        <div
          className="border-b border-white/[0.05] px-[18px] py-2.5"
          style={{ cursor: onCharClick ? "pointer" : "default" }}
          onClick={() => onCharClick?.(event.primary_char)}
        >
          <PlayerDisplay player={player} />
        </div>
      )}

      {/* Body */}
      {hasBody && (
        <div className="px-[18px] py-3.5">
          {event.type === "trip" && (
            <>
              {sp.openai && (
                <p className="mb-3.5 leading-[1.75] text-white/70 italic">
                  &ldquo;{sp.openai}&rdquo;
                </p>
              )}
              <div className="flex flex-wrap gap-6">
                {sp.distance        && <Stat label="Distance"    value={`${Number(sp.distance).toLocaleString()} m`} />}
                {sp.duration        && <Stat label="Duration"    value={`${sp.duration} min`} />}
                {sp.kills           && <Stat label="Kills"       value={sp.kills as string} />}
                {sp.antaName        && <Stat label="Target"      value={sp.antaName as string} color="#e1a965" />}
                {sp.conflictLocationID && <Stat label="Battle site" value={sp.conflictLocationID as string} />}
                {sp.underground !== undefined && <Stat label="Terrain" value="Underground" />}
              </div>
            </>
          )}

          {event.type === "seasonContext" && (
            <>
              {sp.seasoncontext && (
                <p className="mb-4 leading-[1.75] text-white/[0.82]">
                  {sp.seasoncontext as string}
                </p>
              )}
              <div className="flex flex-wrap gap-5 border-t border-white/[0.06] pt-3">
                {Object.entries(sp)
                  .filter(([k, v]) => k !== "seasoncontext" && v !== true)
                  .map(([k, v]) => <Stat key={k} label={k} value={v as string} />)}
              </div>
            </>
          )}

          {event.type === "seasonSummary" && (
            <>
              {sp.beginning && <p className="mb-4 leading-[1.75] text-white/[0.82]">{sp.beginning as string}</p>}
              {sp.middle    && <p className="mb-4 leading-[1.75] text-white/[0.82]">{sp.middle as string}</p>}
              {sp.end       && <p className="leading-[1.75] text-white/[0.82]">{sp.end as string}</p>}
            </>
          )}

          {event.type === "introStory" && (
            <p className="text-white/40 italic">
              {sp.house ? `House ${sp.house as string}` : "Origin story"}
              {sp.openaierror ? " — narrative pending" : ""}
            </p>
          )}

          {(event.type === "tome" || event.type === "ench") && (
            <div className="flex gap-6">
              {sp.type && <Stat label="Type"  value={sp.type as string} />}
              {sp.lvl  && <Stat label="Level" value={sp.lvl as string} />}
            </div>
          )}

          {event.type === "owch" && (
            <div>
              {itemName && (
                <div
                  className="inline-block"
                  style={{ cursor: onItemClick && event.item != null ? "pointer" : "default" }}
                  onClick={() => { if (event.item != null) onItemClick?.(event.item); }}
                >
                  <ItemDisplay itemStr={itemName as string} />
                </div>
              )}
              {sp.context && sp.context !== "0" && (
                <p className="mt-1.5 text-[0.78rem] capitalize text-white/35">
                  {sp.context as string}
                </p>
              )}
              {char2 && (
                <div
                  className="mt-2.5"
                  style={{ cursor: onCharClick && char2Id != null ? "pointer" : "default" }}
                  onClick={() => { if (char2Id != null) onCharClick?.(char2Id); }}
                >
                  <div className="mb-1 text-[0.58rem] uppercase tracking-[0.1em] text-white/[0.18]">vs.</div>
                  <PlayerDisplay player={char2} />
                </div>
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
