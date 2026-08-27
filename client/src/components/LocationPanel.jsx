import { useEffect, useState } from "react";
import { useLang } from "../lang.jsx";
import {
  fmtCoords,
  fmtDistance,
  haversineDistance,
  landUseColor,
  LANDUSE_COLORS,
} from "../lib/format.js";

/**
 * Reverse-geocode a point via Nominatim (free, 1 req/s, no API key).
 * Returns a display string or null on failure.
 */
async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "LandStack-Demo/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;
    const a = data.address;
    const parts = [
      a.road,
      a.neighbourhood || a.suburb,
      a.city || a.town || a.village,
      a.state,
      a.postcode,
    ].filter(Boolean);
    return parts.join(", ") || data.display_name || null;
  } catch {
    return null;
  }
}

/**
 * Given all loaded parcel features and a clicked [lng, lat],
 * compute proximity data: nearest parcel, distance, zone, and land-use breakdown.
 */
function analysePoint(lngLat, features) {
  if (!features || !features.length) {
    return { nearest: null, distance: Infinity, zone: null, landUseCounts: {}, parcelsInRadius: 0 };
  }

  const RADIUS = 1000; // 1 km
  let nearest = null;
  let minDist = Infinity;
  const landUseCounts = {};
  let parcelsInRadius = 0;

  for (const f of features) {
    const c = f.properties.centroid;
    const center = Array.isArray(c) ? c : c && c.coordinates ? c.coordinates : null;
    if (!center) continue;

    const dist = haversineDistance(lngLat, center);
    if (dist < minDist) {
      minDist = dist;
      nearest = f;
    }
    if (dist <= RADIUS) {
      parcelsInRadius++;
      const use = f.properties.landUse || "Unknown";
      landUseCounts[use] = (landUseCounts[use] || 0) + 1;
    }
  }

  const zone = nearest && nearest.properties ? nearest.properties.landUse : null;

  return { nearest, distance: minDist, zone, landUseCounts, parcelsInRadius };
}

function Kv({ k, v, mono }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className={mono ? "v mono" : "v"}>{v}</span>
    </div>
  );
}

export default function LocationPanel({ lngLat, features, open, onClose, onGoToParcel }) {
  const { t } = useLang();
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const analysis = lngLat ? analysePoint([lngLat.lng, lngLat.lat], features) : null;

  // Reverse-geocode when lngLat changes.
  useEffect(() => {
    if (!lngLat) return;
    setAddress(null);
    setLoading(true);
    let cancelled = false;
    reverseGeocode(lngLat.lng, lngLat.lat).then((result) => {
      if (!cancelled) {
        setAddress(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [lngLat?.lng, lngLat?.lat]);

  const nearProps = analysis?.nearest?.properties || {};
  const nearUlpin = nearProps.ulpin || (analysis?.nearest?.id);
  const sortedUses = analysis
    ? Object.entries(analysis.landUseCounts).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <aside className={open ? "panel loc-panel open" : "panel loc-panel"} aria-hidden={!open}>
      <div className="phead">
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="eyebrow">{t("pointInspect")}</div>
        <div className="ulpin" style={{ fontSize: 15 }}>
          {lngLat ? fmtCoords([lngLat.lng, lngLat.lat]) : "—"}
        </div>
        <div className="addr">
          {loading ? (
            <span className="addr-loading">{t("piAddressLoading")}</span>
          ) : address ? (
            address
          ) : lngLat ? (
            t("piAddressNone")
          ) : (
            "—"
          )}
        </div>
      </div>

      <div className="pbody">
        {/* Reverse-geocoded address section */}
        {address ? (
          <div className="layer">
            <div className="lh">
              <span className="tier base">{t("piAddress")}</span>
              <h4>{t("piAddress")}</h4>
            </div>
            <div className="lb">
              <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "4px 0 0" }}>{address}</p>
            </div>
          </div>
        ) : null}

        {/* Nearest parcel */}
        <div className="layer">
          <div className="lh">
            <span className="tier base">{t("base")}</span>
            <h4>{t("piNearestParcel")}</h4>
          </div>
          <div className="lb">
            {analysis?.nearest ? (
              <>
                <div className="nearest-card">
                  <div
                    className="nearest-swatch"
                    style={{ background: landUseColor(nearProps.landUse) }}
                  />
                  <div className="nearest-info">
                    <div className="nearest-ulpin">{nearUlpin}</div>
                    <div className="nearest-meta">
                      {nearProps.landUse} · {nearProps.sector}
                    </div>
                  </div>
                </div>
                <Kv k={t("piDistance")} v={fmtDistance(analysis.distance)} mono />
                {onGoToParcel ? (
                  <button
                    className="btn btn-primary go-parcel-btn"
                    onClick={() => onGoToParcel(nearUlpin)}
                  >
                    {t("piGoToParcel")}
                  </button>
                ) : null}
              </>
            ) : (
              <div className="sh">{t("piNoParcelNearby")}</div>
            )}
          </div>
        </div>

        {/* Estimated zone */}
        {analysis?.zone ? (
          <div className="layer">
            <div className="lh">
              <span className="tier">{t("essential")}</span>
              <h4>{t("piEstimatedZone")}</h4>
            </div>
            <div className="lb">
              <div className="zone-est">
                <span
                  className="zone-dot"
                  style={{ background: landUseColor(analysis.zone) }}
                />
                <span>{analysis.zone}</span>
              </div>
              <p className="zone-note">
                Based on nearest registered parcel ({fmtDistance(analysis.distance)} away)
              </p>
            </div>
          </div>
        ) : null}

        {/* Nearby land use breakdown */}
        {sortedUses.length > 0 ? (
          <div className="layer">
            <div className="lh">
              <span className="tier use">{t("usecase")}</span>
              <h4>{t("piNearbyLandUse")}</h4>
            </div>
            <div className="lb">
              <div className="landuse-summary">
                {sortedUses.map(([use, count]) => (
                  <div className="landuse-row" key={use}>
                    <span
                      className="landuse-dot"
                      style={{ background: LANDUSE_COLORS[use] || "#8AA39B" }}
                    />
                    <span className="landuse-label">{use}</span>
                    <span className="landuse-count">{count}</span>
                  </div>
                ))}
              </div>
              <div className="landuse-foot">
                {analysis.parcelsInRadius} {t("piParcelsInRadius")}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pfoot">
        <div className="fineprint">{t("piClickHint")}</div>
      </div>
    </aside>
  );
}
