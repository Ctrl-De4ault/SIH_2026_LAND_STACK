"use strict";

/**
 * Schema-mapping engine (M6 / FR-06). Applies a MappingProfile's declarative
 * fieldMap to an incoming legacy record, producing a canonical parcel fragment.
 * Each mapping reads a dotted source path, runs a transform, and writes to a
 * dotted target path (numeric segments create/extend arrays, e.g. "owners.0.name").
 */

function getPath(obj, path) {
  return String(path)
    .split(".")
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setPath(obj, path, value) {
  const keys = String(path).split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextIsIndex = /^\d+$/.test(keys[i + 1]);
    if (cur[key] == null) cur[key] = nextIsIndex ? [] : {};
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

// Normalize common Indian date formats to ISO yyyy-mm-dd.
function toISODate(v) {
  if (v == null || v === "") return v;
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s); // dd-mm-yyyy or dd/mm/yyyy
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

const TRANSFORMS = {
  identity: (v) => v,
  trim: (v) => (v == null ? v : String(v).trim()),
  upper: (v) => (v == null ? v : String(v).trim().toUpperCase()),
  lower: (v) => (v == null ? v : String(v).trim().toLowerCase()),
  date: (v) => toISODate(v),
  number: (v) => {
    if (v == null || v === "") return 0;
    const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
    return Number.isNaN(n) ? 0 : n;
  },
  split: (v, args = {}) => {
    if (v == null) return v;
    const parts = String(v).split(args.delimiter || ",").map((s) => s.trim());
    return typeof args.index === "number" ? parts[args.index] : parts;
  },
  lookup: (v, args = {}) => {
    const table = args.table || {};
    return Object.prototype.hasOwnProperty.call(table, v) ? table[v] : (args.default ?? v);
  },
};

/** Apply a single field mapping to the record, returning [target, value]. */
function applyField(record, fm) {
  const raw = getPath(record, fm.source);
  const fn = TRANSFORMS[fm.transform] || TRANSFORMS.identity;
  return [fm.target, fn(raw, fm.args || {})];
}

/** Apply an entire profile's fieldMap to a legacy record → canonical fragment. */
function applyProfile(profile, record) {
  const out = {};
  const trace = [];
  for (const fm of profile.fieldMap || []) {
    const [target, value] = applyField(record, fm);
    setPath(out, target, value);
    trace.push({ source: fm.source, target, transform: fm.transform, value });
  }
  return { output: out, trace };
}

module.exports = { applyProfile, applyField, getPath, setPath, TRANSFORMS, toISODate };
