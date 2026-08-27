"use strict";

/**
 * ULPIN utilities — the Unique Land Parcel Identification Number is the
 * 14-significant-char "Bhu-Aadhaar" that keys every parcel. Format:
 *
 *   UP-21-0007-0400-5374
 *   │  │  │    │    └── 4-char check block (derived from the base)
 *   │  │  │    └─────── parcel serial (4)
 *   │  │  └──────────── revenue village code (4)
 *   │  └─────────────── district code (2)
 *   └────────────────── state / UT code (2 letters)
 *
 * The check block is a deterministic hash of the base string, so a ULPIN can be
 * validated offline without a database lookup (self-checking identifier).
 */

const ULPIN_RE = /^([A-Z]{2})-(\d{2})-(\d{4})-(\d{4})-(\d{4})$/;

/** 4-char check group derived from a base string (matches the seed algorithm). */
function checkBlock(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return String(h % 10000).padStart(4, "0");
}

/** Mint a new ULPIN from its administrative components. */
function mint({ stateCode = "UP", district = "21", village, parcel }) {
  const v = String(village).padStart(4, "0");
  const p = String(parcel).padStart(4, "0");
  const base = `${stateCode}-${district}-${v}-${p}`;
  return `${base}-${checkBlock(base)}`;
}

/** Validate format AND check-digit integrity. Returns a structured result. */
function validate(ulpin) {
  if (typeof ulpin !== "string") return { valid: false, reason: "not_a_string" };
  const m = ULPIN_RE.exec(ulpin.trim());
  if (!m) return { valid: false, reason: "bad_format" };
  const lastDash = ulpin.lastIndexOf("-");
  const base = ulpin.slice(0, lastDash);
  const given = ulpin.slice(lastDash + 1);
  const expected = checkBlock(base);
  if (given !== expected) {
    return { valid: false, reason: "check_block_mismatch", expected };
  }
  return {
    valid: true,
    parts: {
      stateCode: m[1],
      district: m[2],
      village: m[3],
      parcel: m[4],
      checkBlock: m[5],
    },
  };
}

module.exports = { checkBlock, mint, validate, ULPIN_RE };
