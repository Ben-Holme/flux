export function parseSpecial(special: string | undefined | null): Record<string, string | true> {
  const result: Record<string, string | true> = {};
  (special || "").split("#").filter(Boolean).forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) result[part] = true;
    else result[part.slice(0, idx)] = part.slice(idx + 1);
  });
  return result;
}

export function formatDate(str: string): string {
  const [year, month, day, hour, min] = str.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+month - 1]} ${day}, ${year} · ${hour}:${(min || "0").padStart(2, "0")}`;
}

export function buildLookup(data: unknown): Record<string | number, string> {
  if (!data) return {};
  if (Array.isArray(data)) {
    const map: Record<string | number, string> = {};
    (data as Record<string, unknown>[]).forEach((entry) => {
      const id   = entry.id ?? entry.char_id ?? entry.player_id ?? entry.item_id;
      const name = entry.name ?? entry.player_name ?? entry.char_name ?? entry.item_name;
      if (id != null && name) map[id as string] = name as string;
    });
    return map;
  }
  return data as Record<string | number, string>;
}

export function itemAccentColor(rgbaStr: string): string {
  const [r, g, b, intensity] = rgbaStr.split(",").map(Number);
  const f = intensity || 1;
  const rr = r * f, gg = g * f, bb = b * f;
  const max = Math.max(rr, gg, bb, 0.001);
  const scale = 0.78 / max;
  return `${Math.round(rr * scale * 255)},${Math.round(gg * scale * 255)},${Math.round(bb * scale * 255)}`;
}

export function parseItemString(str: string): {
  name: string;
  value: string | null;
  typeId: string | null;
  color: string | null;
} {
  if (!str || !str.includes("#")) return { name: str, value: null, typeId: null, color: null };
  const [name, value, typeId, rgba] = str.split("#");
  return { name, value: value || null, typeId: typeId || null, color: rgba ? itemAccentColor(rgba) : null };
}

export function formatTypeId(id: string): string {
  if (!id) return "";
  return id.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
