// ============================================================================
// Shared formatting helpers + land-use colour ramp. Ported from the prototype
// (assets/data.js + app.js) so the React client matches the static demo.
// ============================================================================

export const LANDUSE_COLORS = {
  Residential: "#2E9E7B",
  Commercial: "#C9942B",
  Institutional: "#5B7FB0",
  "Mixed Use": "#7E6BB5",
  "Park / Open Space": "#5FA55A",
  Agricultural: "#9C8B3E",
};

export const LANDUSE_FALLBACK = "#8AA39B";

export function landUseColor(landUse) {
  return LANDUSE_COLORS[landUse] || LANDUSE_FALLBACK;
}

// Map view defaults (match the prototype's framing of the Chandigarh pilot).
export const MAP_CENTER = [76.785, 30.7345];
export const MAP_ZOOM = 15.3;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(d) {
  if (!d || d === "—" || d === "pending") return d || "—";
  const iso = String(d).slice(0, 10);
  const parts = iso.split("-");
  if (parts.length !== 3) return String(d);
  const [y, m, day] = parts;
  const mi = parseInt(m, 10) - 1;
  if (Number.isNaN(mi) || mi < 0 || mi > 11) return String(d);
  return `${parseInt(day, 10)} ${MONTHS[mi]} ${y}`;
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return `${fmtDate(d.toISOString())}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return String(iso);
  }
}

export function fmtArea(area) {
  if (!area) return "—";
  const sqm = typeof area === "object" ? area.value : area;
  const local = typeof area === "object" ? area.local : null;
  if (typeof sqm !== "number") return "—";
  const base = `${sqm.toLocaleString()} m² (${(sqm / 10000).toFixed(3)} ha)`;
  return local ? `${base} · ${local}` : base;
}

export function fmtMoney(n, currency = "INR") {
  if (n == null) return "—";
  const symbol = currency === "INR" ? "₹" : "";
  return `${symbol}${Number(n).toLocaleString()}`;
}

export function riskClass(r) {
  return r === "high" ? "risk" : r === "medium" ? "warn" : "ok";
}

export function severityClass(s) {
  return s === "high" ? "risk" : s === "medium" ? "warn" : "ok";
}

// Initials for an owner avatar (strips "Estate of" / "Late" prefixes).
export function ownerInitial(name) {
  return String(name || "")
    .replace(/^(Estate of\s+)?(Late\s+)?/i, "")
    .trim()
    .charAt(0)
    .toUpperCase();
}

export function titleCase(s) {
  return String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
