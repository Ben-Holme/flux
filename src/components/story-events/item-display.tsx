"use client";

import { useState } from "react";
import { parseItemString, formatTypeId } from "./utils";
import { getItemIcon } from "@/lib/item-icons";

export default function ItemDisplay({
  itemStr,
  icons = new Set<string>(),
}: {
  itemStr: string;
  icons?: Set<string>;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const item = parseItemString(itemStr);
  if (!item.name) return null;
  const c = item.color || "136,136,136";
  const iconUrl = getItemIcon(item.typeId, icons);

  const iconSlot = iconUrl && !imgFailed ? (
    <div style={{ padding: "0 8px 0 4px" }}>
      <div style={{ position: "relative", width: 44, height: 44, background: "white", borderRadius: 3, flexShrink: 0 }}>
        <img
          src={iconUrl}
          alt=""
          aria-hidden
          width={44}
          height={44}
          onError={() => setImgFailed(true)}
          style={{ display: "block", objectFit: "contain" }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: `rgba(${c},0.7)`,
          mixBlendMode: "multiply",
          borderRadius: 3,
        }} />
      </div>
    </div>
  ) : (
    <div style={{ padding: "0 8px 0 4px" }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 4,
        background: `rgba(${c},0.13)`,
        border: `1px solid rgba(${c},0.4)`,
        boxShadow: `0 0 10px rgba(${c},0.33)`,
        flexShrink: 0,
      }} />
    </div>
  );

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "flex-end",
      background: "rgba(0,0,0,0.4)",
      border: `1px solid rgba(${c},0.27)`,
      borderLeft: `3px solid rgba(${c},1)`,
      borderRadius: "6px",
      marginTop: "4px",
    }}>
      {iconSlot}
      <div style={{ padding: "8px 14px 8px 0" }}>
        <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.85)", textTransform: "capitalize", lineHeight: 1.3 }}>
          {item.name}
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "3px" }}>
          {item.typeId && (
            <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.3)" }}>
              {formatTypeId(item.typeId)}
            </span>
          )}
          {item.value && (
            <span style={{ fontSize: "0.62rem", letterSpacing: ".06em", color: "#c8923a", opacity: 0.7 }}>
              {item.value}g
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
