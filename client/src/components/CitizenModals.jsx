import { useState } from "react";
import { Modal, useToast } from "../ui.jsx";
import { useLang } from "../lang.jsx";
import { useAuth } from "../auth.jsx";
import api from "../api.js";
import Certificate from "./Certificate.jsx";
import { SERVICE_TYPE_KEYS, SR_STATUS_LABELS, SR_STATUS_TONE } from "../lib/constants.js";
import { fmtDateTime, titleCase } from "../lib/format.js";

// ---------------------------------------------------------------------------
// Verify ownership & get record  (FR-07)
// Ownership summary is public; an authoritative, verifiable certificate is
// issued by an officer. Staff see an "issue" action; citizens see the preview.
// ---------------------------------------------------------------------------
export function CertificateModal({ parcel, onClose }) {
  const { t } = useLang();
  const { isStaff } = useAuth();
  const toast = useToast();
  const [issued, setIssued] = useState(null);
  const [busy, setBusy] = useState(false);

  const snapshot = issued
    ? issued.snapshot
    : {
        ulpin: parcel.ulpin,
        ownerNames: (parcel.owners || []).map((o) => o.name).join(", "),
        sector: parcel.sector,
        state: parcel.state,
        area: parcel.area,
        landUse: parcel.landUse,
        encumbranceStatus:
          parcel.layers && parcel.layers.encumbrance && !parcel.layers.encumbrance.protected
            ? titleCase(parcel.layers.encumbrance.status)
            : "—",
      };

  async function issue() {
    setBusy(true);
    try {
      const res = await api.certificates.issue({ ulpin: parcel.ulpin, kind: "ror_extract" });
      // Fetch the stored snapshot for a faithful certificate face.
      const full = await api.certificates.get(res.recordId);
      setIssued(full);
      toast(t("tVerified"));
    } catch (e) {
      toast(e.message || t("tError"));
    } finally {
      setBusy(false);
    }
  }

  function copyId() {
    if (!issued) return;
    navigator.clipboard && navigator.clipboard.writeText(issued.recordId);
    toast(t("tCopied"));
  }

  const footer = (
    <>
      {issued ? (
        <button className="btn btn-line" onClick={copyId}>
          {t("copyId")}
        </button>
      ) : isStaff ? (
        <button className="btn btn-primary" onClick={issue} disabled={busy}>
          {busy ? "…" : t("verifyOwnership")}
        </button>
      ) : null}
      <button className="btn btn-ghost" onClick={() => window.print()}>
        {t("printSave")}
      </button>
    </>
  );

  return (
    <Modal title={t("ownershipRecord")} onClose={onClose} footer={footer}>
      <Certificate
        recordId={issued ? issued.recordId : null}
        snapshot={snapshot}
        issuedAt={issued ? issued.issuedAt : null}
        verified={Boolean(issued)}
      />
      {!issued ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14 }}>
          {isStaff
            ? "Issue a verifiable, tamper-evident record. It can be checked by anyone on the Verify page using its record ID."
            : "Ownership shown above is from the public Record of Rights. An authoritative, verifiable certificate is issued by a land officer — verify an issued record on the Verify page."}
        </p>
      ) : null}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Apply for a service  (M7 / FR-08)  — public; no sign-in required.
// ---------------------------------------------------------------------------
export function ServiceRequestModal({ parcel, onClose, onFiled }) {
  const { t } = useLang();
  const toast = useToast();
  const [type, setType] = useState(SERVICE_TYPE_KEYS[0].value);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.service.create({
        type,
        ulpin: parcel.ulpin,
        applicant: { name, email, phone },
      });
      setResult(res);
      toast(t("srFiled"));
      onFiled && onFiled(res);
    } catch (err) {
      toast(err.message || t("tError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("fileRequest")} onClose={onClose}>
      {result ? (
        <div className="verify-result valid">
          <div className="vr-top">
            <svg className="vr-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {t("srFiled")}
          </div>
          <p style={{ fontSize: 13.5, margin: "0 0 6px" }}>
            {t("srType")}: <b>{titleCase(result.type)}</b> · {t("cParcel")}: <b>{result.ulpin}</b>
          </p>
          <p style={{ fontSize: 13.5, margin: 0 }}>
            {t("cRecordId")}: <b style={{ fontFamily: "var(--font-mono)" }}>{result.requestId}</b> —{" "}
            {SR_STATUS_LABELS[result.status] || result.status}
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="field-group">
            <label>{t("cParcel")}</label>
            <input value={parcel.ulpin} readOnly style={{ fontFamily: "var(--font-mono)" }} />
          </div>
          <div className="field-group">
            <label>{t("srType")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {SERVICE_TYPE_KEYS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.key)}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>{t("srApplicantName")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field-group">
            <label>{t("srApplicantEmail")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field-group">
            <label>{t("srApplicantPhone")}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", marginTop: 6 }}>
            {busy ? "…" : t("srSubmit")}
          </button>
          <p style={{ fontSize: 11, color: "var(--ink-faint)", textAlign: "center", marginTop: 9 }}>
            {t("demoData")}
          </p>
        </form>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Track a request  (public by request id)
// ---------------------------------------------------------------------------
export function TrackRequestModal({ initialId = "", onClose }) {
  const { t } = useLang();
  const [id, setId] = useState(initialId);
  const [sr, setSr] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup() {
    const rid = id.trim();
    if (!rid) return;
    setBusy(true);
    setErr("");
    setSr(null);
    try {
      const res = await api.service.get(rid);
      setSr(res);
    } catch (e) {
      setErr(e.status === 404 ? t("lrInvalidBody") : e.message || t("tError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("trackRequest")} onClose={onClose}>
      <div className="verify-lookup">
        <div className="field">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={t("srTrackPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
          />
          <button className="btn btn-primary" onClick={lookup} disabled={busy}>
            {t("check")}
          </button>
        </div>
      </div>

      {err ? (
        <div className="verify-result invalid">
          <div className="vr-top">
            <svg className="vr-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            {t("lrInvalidTitle")}
          </div>
          <p style={{ fontSize: 13.5, margin: 0 }}>{err}</p>
        </div>
      ) : null}

      {sr ? (
        <div>
          <div className="verify-result valid" style={{ marginBottom: 14 }}>
            <div className="vr-top">
              {t("srStatus")}: {SR_STATUS_LABELS[sr.status] || sr.status}
            </div>
            <p style={{ fontSize: 13.5, margin: 0 }}>
              {titleCase(sr.type)} · {sr.ulpin}
            </p>
          </div>

          <div className="field-group">
            <label>{t("srHistory")}</label>
          </div>
          <div className="timeline">
            {(sr.history || []).map((h, i) => (
              <div className="tl-row" key={i}>
                <span className={`pill ${SR_STATUS_TONE[h.to] || "neutral"}`}>
                  {SR_STATUS_LABELS[h.to] || h.to}
                </span>
                <span className="tl-meta">
                  {h.byRole ? titleCase(h.byRole) : "system"}
                  {h.at ? ` · ${fmtDateTime(h.at)}` : ""}
                  {h.note ? ` — ${h.note}` : ""}
                </span>
              </div>
            ))}
          </div>

          {sr.result && sr.result.certificateId ? (
            <p style={{ fontSize: 12.5, color: "var(--survey)", marginTop: 12, fontWeight: 600 }}>
              {t("cRecordId")}: {sr.result.certificateId}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
