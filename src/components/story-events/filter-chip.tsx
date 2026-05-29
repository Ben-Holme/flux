export default function FilterChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}22` : "rgba(0,0,0,0.35)",
        border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
        borderRadius: "4px",
        color: active ? color : "rgba(255,255,255,0.45)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.68rem",
        letterSpacing: ".15em",
        textTransform: "uppercase",
        padding: "5px 12px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
