import { useEffect, useState, useCallback } from "react";
import { useLang } from "../lang.jsx";
import { useAuth } from "../auth.jsx";
import api from "../api.js";
import {
  fmtArea,
  fmtDate,
  fmtMoney,
  ownerInitial,
  riskClass,
  titleCase,
} from "../lib/format.js";

function LockIcon() {
  return (
    <svg className="lock-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Kv({ k, v, mono }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className={mono ? "v mono" : "v"}>{v}</span>
    </div>
  );
}

// A protected layer that the caller may not see yet.
function LockedBody({ access, t }) {
  const isRestricted = access === "restricted";
  return (
    <div className="locked">
      <LockIcon />
      <p>{t("lockedBody")}</p>
      <div className="consent-note" style={{ color: "var(--ink-faint)", fontWeight: 600 }}>
        {isRestricted ? t("usecase") + " · restricted" : t("essential") + " · consent-gated"}
      </div>
    </div>
  );
}

export default function ParcelPanel({ feature, open, onClose, onVerify, onApply, onTrack }) {
  const { t } = useLang();
  const { isStaff } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [consentInput, setConsentInput] = useState("");
  const [consentUsed, setConsentUsed] = useState("");

  const ulpin = feature && (feature.id || (feature.properties && feature.properties.ulpin));

  const load = useCallback(
    async (consentToken) => {
      if (!ulpin) return;
      setLoading(true);
      setErr("");
      try {
        const d = await api.parcels.get(ulpin, consentToken || undefined);
        setDetail(d);
      } catch (e) {
        setErr(e.message || "Could not load parcel");
      } finally {
        setLoading(false);
      }
    },
    [ulpin]
  );

  // (Re)load whenever the selected parcel changes; reset any consent context.
  useEffect(() => {
    setConsentInput("");
    setConsentUsed("");
    setDetail(null);
    if (ulpin) load("");
  }, [ulpin, load]);

  function unlock() {
    const token = consentInput.trim();
    if (!token) return;
    setConsentUsed(token);
    load(token);
  }

  const props = (feature && feature.properties) || {};
  const layers = (detail && detail.layers) || {};
  const access = (detail && detail.access) || { unlocked: [], protected: [], role: "anonymous" };
  const privileged = isStaff || (access.role && access.role !== "anonymous" && access.role !== "citizen");
  const hasLockedConsent = !privileged && (access.protected || []).some((k) => ["ror", "registration", "encumbrance"].includes(k));

  const owners = (detail && detail.owners) || [];
  const risk = (detail && detail.disputeRisk) || props.disputeRisk || "low";

  // Trust badges — only for layers we can actually see.
  const enc = layers.encumbrance;
  const tax = layers.tax;
  const encVisible = enc && !enc.protected;
  const taxVisible = tax && !tax.protected;

  return (
    <aside className={open ? "panel open" : "panel"} aria-hidden={!open}>
      <div className="phead">
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="eyebrow">{t("base")} · ULPIN</div>
        <div className="ulpin">{ulpin || "—"}</div>
        <div className="addr">
          {props.landUse ? `${props.landUse} · ` : ""}
          {props.address || (detail && `${detail.sector}, ${detail.state}`) || ""}
        </div>
      </div>

      <div className="pbody">
        {loading && !detail ? (
          <div className="panel-empty">Loading parcel record…</div>
        ) : err ? (
          <div className="panel-empty" style={{ color: "#9a3823" }}>
            {err}
          </div>
        ) : (
          <>
            <div className="badges">
              <span className={`badge ${riskClass(risk)}`}>
                <span className="d" />
                {t(risk === "high" ? "riskHigh" : risk === "medium" ? "riskMedium" : "riskLow")}
              </span>
              {encVisible ? (
                <span className={`badge ${enc.status === "clear" ? "ok" : "warn"}`}>
                  <span className="d" />
                  {enc.status === "clear" ? t("bClear") : t("bMortgage")}
                </span>
              ) : null}
              {taxVisible ? (
                <span
                  className={`badge ${
                    tax.status === "paid" ? "ok" : tax.status === "exempt" ? "ok" : "warn"
                  }`}
                >
                  <span className="d" />
                  {tax.status === "paid" ? t("bTaxPaid") : tax.status === "exempt" ? t("bTaxExempt") : t("bTaxDue")}
                </span>
              ) : null}
            </div>

            {/* ---- BASE: spatial identity + ownership summary ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier base">{t("base")}</span>
                <h4>{t("spatial")}</h4>
              </div>
              <div className="lb">
                <Kv k={t("landUse")} v={props.landUse || (detail && detail.landUse) || "—"} />
                <Kv k={t("area")} v={fmtArea(detail ? detail.area : props.area)} />
                <Kv k={t("crs")} v={(detail && detail.crs) || "EPSG:4326"} mono />
                {detail && detail.legacyIds && detail.legacyIds.length ? (
                  <Kv
                    k={t("khasra")}
                    v={
                      (detail.legacyIds.find((x) => /khasra/i.test(x.type)) || detail.legacyIds[0]).value
                    }
                    mono
                  />
                ) : null}
              </div>
            </div>

            {/* ---- BASE: ownership summary (public, as in RoR viewers) ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier base">{t("base")}</span>
                <h4>{t("ownershipRoR")}</h4>
              </div>
              <div className="lb">
                {owners.length ? (
                  owners.map((o, i) => (
                    <div className="owner" key={i}>
                      <div className="av">{ownerInitial(o.name)}</div>
                      <div>
                        <div className="nm">{o.name}</div>
                        {o.share ? (
                          <div className="sh">
                            {o.share} {t("shareLbl")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sh">—</div>
                )}
              </div>
            </div>

            {/* ---- Consent unlock bar (only when something is locked) ---- */}
            {hasLockedConsent ? (
              <div className="layer">
                <div className="lh">
                  <span className="tier">{t("essential")}</span>
                  <h4>{t("lockedTitle")}</h4>
                </div>
                <div className="lb">
                  <div className="locked">
                    <LockIcon />
                    <p>{t("lockedBody")}</p>
                    <div className="field">
                      <input
                        value={consentInput}
                        onChange={(e) => setConsentInput(e.target.value)}
                        placeholder={t("consentPlaceholder")}
                        onKeyDown={(e) => e.key === "Enter" && unlock()}
                      />
                      <button className="btn btn-primary" onClick={unlock}>
                        {t("unlock")}
                      </button>
                    </div>
                    {consentUsed && (access.unlocked || []).length ? (
                      <div className="consent-note">{t("unlockedByConsent")}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ---- ESSENTIAL: registration ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier">{t("essential")}</span>
                <h4>{t("registration")}</h4>
              </div>
              <div className="lb">
                {layers.registration && !layers.registration.protected ? (
                  <>
                    <Kv k={t("deedType")} v={titleCase(layers.registration.type) || "—"} />
                    <Kv k={t("docNo")} v={layers.registration.docNo || "—"} mono />
                    <Kv k={t("regDate")} v={fmtDate(layers.registration.date)} />
                    {layers.registration.subRegistrarOffice ? (
                      <Kv k="SRO" v={layers.registration.subRegistrarOffice} />
                    ) : null}
                  </>
                ) : (
                  <LockedBody access={layers.registration ? layers.registration.access : "consent"} t={t} />
                )}
              </div>
            </div>

            {/* ---- ESSENTIAL: RoR mutation detail ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier">{t("essential")}</span>
                <h4>{t("mutation")}</h4>
              </div>
              <div className="lb">
                {layers.ror && !layers.ror.protected ? (
                  <>
                    <Kv k="Khata" v={layers.ror.khataNo || "—"} mono />
                    <Kv k="Khasra" v={layers.ror.khasraNo || "—"} mono />
                    <Kv k={t("mutation")} v={fmtDate(layers.ror.mutationDate)} />
                    <Kv k={t("taxStatus")} v={titleCase(layers.ror.mutationStatus) || "—"} />
                    {layers.ror.tenancy ? <Kv k="Tenancy" v={titleCase(layers.ror.tenancy)} /> : null}
                  </>
                ) : (
                  <LockedBody access={layers.ror ? layers.ror.access : "consent"} t={t} />
                )}
              </div>
            </div>

            {/* ---- ESSENTIAL: zoning (public) ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier">{t("essential")}</span>
                <h4>{t("zoningLanduse")}</h4>
              </div>
              <div className="lb">
                {layers.zoning ? (
                  <>
                    <Kv k={t("zone")} v={layers.zoning.code || "—"} mono />
                    <Kv k={t("landUse")} v={layers.zoning.description || (detail && detail.landUse) || "—"} />
                    {layers.zoning.masterPlan ? <Kv k="Master plan" v={layers.zoning.masterPlan} /> : null}
                  </>
                ) : (
                  <div className="sh">—</div>
                )}
              </div>
            </div>

            {/* ---- ESSENTIAL: encumbrance ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier">{t("essential")}</span>
                <h4>{t("encumbrance")}</h4>
              </div>
              <div className="lb">
                {encVisible ? (
                  <>
                    <Kv k={t("taxStatus")} v={titleCase(enc.status) || "—"} />
                    <Kv k="Detail" v={enc.detail || "—"} />
                  </>
                ) : (
                  <LockedBody access={enc ? enc.access : "consent"} t={t} />
                )}
              </div>
            </div>

            {/* ---- USE-CASE: property tax ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier use">{t("usecase")}</span>
                <h4>{t("propertyTax")}</h4>
              </div>
              <div className="lb">
                {taxVisible ? (
                  <>
                    <Kv k={t("taxStatus")} v={titleCase(tax.status) || "—"} />
                    <Kv k={t("paidTill")} v={fmtDate(tax.paidTill)} />
                    <Kv k={t("dueAmount")} v={fmtMoney(tax.due, tax.currency)} mono />
                  </>
                ) : (
                  <LockedBody access={tax ? tax.access : "restricted"} t={t} />
                )}
              </div>
            </div>

            {/* ---- USE-CASE: utilities ---- */}
            <div className="layer">
              <div className="lh">
                <span className="tier use">{t("usecase")}</span>
                <h4>{t("utilities")}</h4>
              </div>
              <div className="lb">
                {layers.utilities && !layers.utilities.protected ? (
                  Array.isArray(layers.utilities) && layers.utilities.length ? (
                    <div className="chiprow">
                      {layers.utilities.map((u, i) => (
                        <span className="chip" key={i}>
                          {u}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="sh">—</div>
                  )
                ) : (
                  <LockedBody access={layers.utilities ? layers.utilities.access : "restricted"} t={t} />
                )}
              </div>
            </div>

            {detail && detail.updatedAt ? (
              <div style={{ marginTop: 14, fontSize: 11, color: "var(--ink-faint)", textAlign: "center" }}>
                {t("lastUpdated")}: {fmtDate(detail.updatedAt)}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="pfoot">
        <button className="btn btn-primary" onClick={() => onVerify && onVerify(detail || { ulpin })} disabled={!detail}>
          {t("verifyOwnership")}
        </button>
        <div className="fineprint">{t("demoData")}</div>
        <div className="row-btns" style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={() => onApply && onApply(detail || { ulpin })} disabled={!ulpin}>
            {t("fileRequest")}
          </button>
          <button className="btn btn-ghost" onClick={() => onTrack && onTrack()}>
            {t("trackRequest")}
          </button>
        </div>
      </div>
    </aside>
  );
}
