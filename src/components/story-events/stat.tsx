export default function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,0.28)", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.82rem", color: color || "rgba(255,255,255,0.72)", textTransform: "capitalize" }}>
        {value}
      </div>
    </div>
  );
}
