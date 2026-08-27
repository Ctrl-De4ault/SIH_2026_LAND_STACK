"use strict";

/**
 * Dispute-risk scoring (FR-14). A transparent, explainable heuristic over a
 * parcel's essential/use-case attributes — not a black box. Returns a 0..1
 * score, a severity band and the contributing factors so an officer can see
 * *why* a parcel is flagged.
 */
function computeDisputeRisk(parcel) {
  const factors = [];
  let score = 0;
  const add = (points, reason) => {
    score += points;
    factors.push({ points: Number(points.toFixed(2)), reason });
  };

  const ror = (parcel.layers && parcel.layers.ror) || {};
  const enc = (parcel.layers && parcel.layers.encumbrance) || {};
  const tax = (parcel.layers && parcel.layers.tax) || {};

  if (ror.mutationStatus === "disputed") add(0.4, "Mutation is disputed");
  else if (ror.mutationStatus === "pending") add(0.2, "Mutation pending");

  const shares = (parcel.owners || []).map((o) => o.share);
  if (shares.includes("disputed")) add(0.25, "Ownership share contested");
  if ((parcel.owners || []).length > 1) add(0.05, "Multiple co-owners");

  if (enc.status === "attached" || enc.status === "disputed") add(0.3, `Encumbrance: ${enc.status}`);
  else if (enc.status === "charged") add(0.1, "Active mortgage/charge");

  if (tax.status === "due") {
    const due = Number(tax.due) || 0;
    if (due >= 10000) add(0.2, `High tax arrears (₹${due})`);
    else if (due > 0) add(0.1, `Tax arrears (₹${due})`);
  }

  if (parcel.status === "disputed") add(0.2, "Record flagged disputed");

  score = Math.max(0, Math.min(1, score));
  const severity = score >= 0.66 ? "high" : score >= 0.33 ? "medium" : "low";
  return { score: Number(score.toFixed(2)), severity, factors };
}

/**
 * Mock change-detection (FR-13). Deterministically derives a pseudo built-up
 * area delta from the ULPIN so results are stable across runs (stands in for a
 * satellite/imagery diff pipeline).
 */
function computeChangeDetection(parcel) {
  let h = 0;
  for (let i = 0; i < parcel.ulpin.length; i++) h = (h * 31 + parcel.ulpin.charCodeAt(i)) >>> 0;
  const deltaPct = (h % 130) / 10; // 0.0 .. 12.9 %
  const severity = deltaPct >= 8 ? "high" : deltaPct >= 5 ? "medium" : "low";
  return {
    deltaPct: Number(deltaPct.toFixed(1)),
    flagged: deltaPct >= 5,
    severity,
    summary: `Built-up footprint changed ~${deltaPct.toFixed(1)}% versus last cadastral snapshot.`,
  };
}

module.exports = { computeDisputeRisk, computeChangeDetection };
