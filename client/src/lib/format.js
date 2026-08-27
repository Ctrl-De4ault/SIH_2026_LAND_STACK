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

// Map view defaults — framed on the fictional Prayagraj (UP) pilot cadastre.
export const MAP_CENTER = [81.8362, 25.4516];
export const MAP_ZOOM = 15.6;

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

// --- Point Inspector utilities -----------------------------------------------

/**
 * Haversine distance between two [lng, lat] points. Returns metres.
 */
export function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtDistance(metres) {
  if (metres == null || Number.isNaN(metres)) return "—";
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(2)} km`;
}

export function fmtCoords([lng, lat]) {
  return `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;
}
