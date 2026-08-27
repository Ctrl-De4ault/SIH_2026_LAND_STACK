import { useState, useMemo, useRef, useEffect } from "react";
import { useLang } from "../lang.jsx";
import { landUseColor } from "../lib/format.js";

/**
 * Floating search over the parcels already loaded by the map. Matches ULPIN,
 * owner names, sector/address and land use — the same fields the prototype's
 * search used, now driven by the live FeatureCollection.
 */
export default function SearchBox({ features, onPick }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [openList, setOpenList] = useState(false);
  const boxRef = useRef(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const hits = [];
    for (const f of features) {
      const p = f.properties || {};
      const hay = [p.ulpin, p.ownerNames, p.address, p.sector, p.landUse]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (hay.includes(term)) hits.push(f);
      if (hits.length >= 7) break;
    }
    return hits;
  }, [q, features]);

  useEffect(() => setActive(0), [q]);

  // Close the suggestion list on outside click.
  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpenList(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(f) {
    if (!f) return;
    onPick(f.properties.ulpin);
    setQ(f.properties.ulpin);
    setOpenList(false);
  }

  function onKey(e) {
    if (!openList || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpenList(false);
    }
  }

  return (
    <div className={q ? "search has-val" : "search"} ref={boxRef}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpenList(true);
        }}
        onFocus={() => setOpenList(true)}
        onKeyDown={onKey}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
      />
      <button
        className="clr"
        onClick={() => {
          setQ("");
          setOpenList(false);
        }}
        aria-label="Clear"
      >
        ×
      </button>

      {openList && q.trim() ? (
        <div className="suggest">
          {results.length ? (
            results.map((f, i) => {
              const p = f.properties;
              return (
                <div
                  className={i === active ? "row active" : "row"}
                  key={p.ulpin}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(f);
                  }}
                >
                  <span className="swatch" style={{ background: landUseColor(p.landUse) }} />
                  <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <div className="main">{p.ulpin}</div>
                    <div className="meta">{p.ownerNames || p.address}</div>
                  </div>
                  <span className="use">{p.landUse}</span>
                </div>
              );
            })
          ) : (
            <div className="empty">{t("noResults")}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
