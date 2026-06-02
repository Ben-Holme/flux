import { parseItemString, formatTypeId } from "./utils";

export default function ItemDisplay({ itemStr }: { itemStr: string }) {
  const item = parseItemString(itemStr);
  if (!item.name) return null;
  const c = item.color || "136,136,136";
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      background: "rgba(0,0,0,0.4)",
      border: `1px solid rgba(${c},0.27)`,
      borderLeft: `3px solid rgba(${c},1)`,
      borderRadius: "6px",
      padding: "8px 14px",
      marginTop: "4px",
    }}>
      <div style={{
        width: "28px",
        height: "28px",
        borderRadius: "4px",
        background: `rgba(${c},0.13)`,
        border: `1px solid rgba(${c},0.4)`,
        boxShadow: `0 0 10px rgba(${c},0.33)`,
        flexShrink: 0,
      }} />
      <div>
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
