import { useState, useEffect, useCallback } from "react";
import { useLang } from "../lang.jsx";
import { useAuth } from "../auth.jsx";
import { useToast } from "../ui.jsx";
import api from "../api.js";
import {
  ROLE_LABELS,
  SR_TRANSITIONS,
  SR_STATUS_LABELS,
  SR_STATUS_TONE,
} from "../lib/constants.js";
import { fmtDateTime, fmtMoney, titleCase, severityClass } from "../lib/format.js";

const STAFF_ROLES = ["patwari", "sub_registrar", "planner", "tax_officer", "admin", "national_steward"];

// Small data-fetching helper — load on mount / when reload() is called.
function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      setData(await fn());
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { data, loading, err, reload: run };
}

// ===========================================================================
// Login
// ===========================================================================
function Login() {
  const { t } = useLang();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = useAsync(() => api.auth.demoUsers(), []);

  async function submit(e, presetEmail, presetPw) {
    if (e && e.preventDefault) e.preventDefault();
    const em = presetEmail || email;
    const pw = presetPw || password;
    setBusy(true);
    setErr("");
    try {
      const user = await login(em, pw);
      if (!STAFF_ROLES.includes(user.role)) {
        setErr("This is a citizen/institution account — the console is for staff roles.");
      } else {
        toast(t("tSignedIn"));
      }
    } catch (e2) {
      setErr(e2.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  const password0 = demo.data && demo.data.password;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>{t("consoleTitle")}</h2>
        <p className="lead">Sign in with a staff account to operate workflows, geo-intelligence and consent.</p>
        <form onSubmit={submit}>
          <div className="field-group">
            <label>{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@landstack.in" required />
          </div>
          <div className="field-group">
            <label>{t("password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {err ? <div className="login-err">{err}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "…" : t("login")}
          </button>
        </form>
      </div>

      <div className="demo-accounts">
        <h4>{t("demoAccounts")}</h4>
        {demo.loading ? (
          <div className="loading">Loading accounts…</div>
        ) : demo.err ? (
          <div className="login-err">{demo.err}</div>
        ) : (
          (demo.data.users || [])
            .filter((u) => STAFF_ROLES.includes(u.role))
            .map((u) => (
              <button key={u.email} className="acct" onClick={() => submit(null, u.email, password0)}>
                <div>
                  <div className="role">{ROLE_LABELS[u.role] || titleCase(u.role)}</div>
                  <div className="em">{u.email}</div>
                </div>
                <span className="pill neutral">{u.role}</span>
              </button>
            ))
        )}
        {password0 ? (
          <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 10 }}>
            Shared demo password: <code style={{ fontFamily: "var(--font-mono)" }}>{password0}</code> · {t("demoData")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ===========================================================================
// Overview (dashboard KPIs)
// ===========================================================================
function Dist({ title, obj, tone = () => "" }) {
  const items = Object.entries(obj || {});
  const max = items.reduce((m, [, n]) => Math.max(m, n), 0) || 1;
  return (
    <div className="dist">
      <h3>{title}</h3>
      {items.length ? (
        items.map(([k, n]) => (
          <div className="bar-row" key={k}>
            <span className="bl">{titleCase(k)}</span>
            <span className="track">
              <span className={`fill ${tone(k)}`} style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="bv">{n}</span>
          </div>
        ))
      ) : (
        <div className="bar-row">
          <span className="bl">—</span>
        </div>
      )}
    </div>
  );
}

function Overview() {
  const { t } = useLang();
  const { data, loading, err } = useAsync(() => api.geoIntel.dashboard(), []);
  if (loading) return <div className="loading">Loading overview…</div>;
  if (err) return <div className="empty-state">{err}</div>;

  const riskTone = (k) => (k === "high" ? "risk" : k === "medium" ? "warn" : "");
  const srTone = (k) => {
    const tn = SR_STATUS_TONE[k];
    return tn === "ok" ? "" : tn === "neutral" ? "" : tn || "";
  };

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">{t("totalParcels")}</div>
          <div className="value">{data.parcels.total}</div>
          <div className="sub">Base layer · ULPIN-keyed</div>
        </div>
        <div className="kpi">
          <div className="label">{t("openFlags")}</div>
          <div className="value">{data.geoIntel.open}</div>
          <div className="sub">Geo-intelligence</div>
        </div>
        <div className="kpi">
          <div className="label">{t("activeConsents")}</div>
          <div className="value">{data.consents.active}</div>
          <div className="sub">Consent tokens live</div>
        </div>
        <div className="kpi">
          <div className="label">{t("taxArrears")}</div>
          <div className="value">{fmtMoney(data.tax.arrearsTotal, data.tax.currency)}</div>
          <div className="sub">{data.tax.arrearsParcels} parcel(s)</div>
        </div>
      </div>

      <div className="two-col section-gap">
        <Dist title="Parcels by dispute risk" obj={data.parcels.byDisputeRisk} tone={riskTone} />
        <Dist title="Parcels by land use" obj={data.parcels.byLandUse} />
      </div>
      <div className="two-col section-gap">
        <Dist title="Service requests by status" obj={data.serviceRequests.byStatus} tone={srTone} />
        <Dist title="Geo-flags by severity" obj={data.geoIntel.bySeverity} tone={riskTone} />
      </div>
    </div>
  );
}

// ===========================================================================
// Workflow queue
// ===========================================================================
function Queue() {
  const toast = useToast();
  const { data, loading, err, reload } = useAsync(() => api.service.list(), []);
  const [drafts, setDrafts] = useState({}); // requestId → {to, note}

  async function advance(sr) {
    const d = drafts[sr.requestId] || {};
    const to = d.to || (SR_TRANSITIONS[sr.status] || [])[0];
    if (!to) return;
    try {
      await api.service.transition(sr.requestId, to, d.note || "");
      toast(`→ ${SR_STATUS_LABELS[to] || to}`);
      reload();
    } catch (e) {
      toast(e.message || "Transition failed");
    }
  }

  if (loading) return <div className="loading">Loading queue…</div>;
  if (err) return <div className="empty-state">{err}</div>;
  const rows = (data && data.requests) || [];

  return (
    <div className="card">
      <div className="card-head">
        <h3>Workflow queue · {rows.length}</h3>
        <div className="tools">
          <button className="btn btn-line btn-sm" onClick={reload}>
            Refresh
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Request</th>
              <th>Type</th>
              <th>Parcel</th>
              <th>Status</th>
              <th>Advance</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((sr) => {
                const nexts = SR_TRANSITIONS[sr.status] || [];
                const d = drafts[sr.requestId] || {};
                return (
                  <tr key={sr.requestId}>
                    <td className="mono-cell">{sr.requestId}</td>
                    <td>{titleCase(sr.type)}</td>
                    <td className="mono-cell">{sr.ulpin}</td>
                    <td>
                      <span className={`pill ${SR_STATUS_TONE[sr.status] || "neutral"}`}>
                        {SR_STATUS_LABELS[sr.status] || sr.status}
                      </span>
                    </td>
                    <td>
                      {nexts.length ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <select
                            className="inline-select"
                            value={d.to || nexts[0]}
                            onChange={(e) =>
                              setDrafts((s) => ({ ...s, [sr.requestId]: { ...d, to: e.target.value } }))
                            }
                          >
                            {nexts.map((n) => (
                              <option key={n} value={n}>
                                {SR_STATUS_LABELS[n] || n}
                              </option>
                            ))}
                          </select>
                          <button className="btn btn-primary btn-sm" onClick={() => advance(sr)}>
                            Apply
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>— final —</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">No service requests yet. File one from the Parcel Explorer.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// Geo-intelligence
// ===========================================================================
function GeoIntel() {
  const { t } = useLang();
  const toast = useToast();
  const { data, loading, err, reload } = useAsync(() => api.geoIntel.list(), []);
  const [ulpin, setUlpin] = useState("");
  const [busy, setBusy] = useState(false);

  async function scan() {
    setBusy(true);
    try {
      const r = await api.geoIntel.changeScan();
      toast(`Scanned ${r.scanned} · flagged ${r.flagged}`);
      reload();
    } catch (e) {
      toast(e.message || "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  async function score() {
    const id = ulpin.trim();
    if (!id) return;
    setBusy(true);
    try {
      const r = await api.geoIntel.disputeRisk(id);
      toast(`${id}: ${r.severity} (${r.score})`);
      reload();
    } catch (e) {
      toast(e.message || "Scoring failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(flag, status) {
    try {
      await api.geoIntel.setStatus(flag._id, status);
      reload();
    } catch (e) {
      toast(e.message || "Update failed");
    }
  }

  const flags = (data && data.flags) || [];

  return (
    <div className="card">
      <div className="card-head">
        <h3>Geo-intelligence flags · {flags.length}</h3>
        <div className="tools">
          <input
            className="inline-select"
            style={{ fontFamily: "var(--font-mono)", minWidth: 190 }}
            placeholder="ULPIN to score…"
            value={ulpin}
            onChange={(e) => setUlpin(e.target.value)}
          />
          <button className="btn btn-line btn-sm" onClick={score} disabled={busy}>
            {t("scoreDispute")}
          </button>
          <button className="btn btn-primary btn-sm" onClick={scan} disabled={busy}>
            {t("runChangeScan")}
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Parcel</th>
              <th>Severity</th>
              <th>Summary</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <div className="loading">Loading flags…</div>
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">{err}</div>
                </td>
              </tr>
            ) : flags.length ? (
              flags.map((f) => (
                <tr key={f._id}>
                  <td>{titleCase(f.kind)}</td>
                  <td className="mono-cell">{f.ulpin}</td>
                  <td>
                    <span className={`pill ${severityClass(f.severity)}`}>{f.severity}</span>
                  </td>
                  <td style={{ maxWidth: 320 }}>{f.summary}</td>
                  <td>
                    <select
                      className="inline-select"
                      value={f.status}
                      onChange={(e) => setStatus(f, e.target.value)}
                    >
                      {["open", "reviewing", "confirmed", "dismissed"].map((s) => (
                        <option key={s} value={s}>
                          {titleCase(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">No flags. Run a change-detection scan or score a parcel.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// Consent registry
// ===========================================================================
const SCOPE_OPTIONS = ["ror", "registration", "encumbrance", "tax", "utilities"];

function ConsentRegistry() {
  const { t } = useLang();
  const toast = useToast();
  const { data, loading, err, reload } = useAsync(() => api.consent.list(), []);
  const [form, setForm] = useState({ ulpin: "", grantedTo: "", scope: ["ror"], ttlDays: 30 });
  const [issued, setIssued] = useState(null);
  const [busy, setBusy] = useState(false);

  function toggleScope(s) {
    setForm((f) => ({
      ...f,
      scope: f.scope.includes(s) ? f.scope.filter((x) => x !== s) : [...f.scope, s],
    }));
  }

  async function issue(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.consent.issue({
        ulpin: form.ulpin.trim(),
        grantedTo: form.grantedTo.trim(),
        scope: form.scope,
        ttlDays: Number(form.ttlDays) || 30,
        purpose: "Console-issued consent",
      });
      setIssued(res);
      toast(t("tSaved"));
      reload();
    } catch (e2) {
      toast(e2.message || "Could not issue");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(tok) {
    try {
      await api.consent.revoke(tok);
      reload();
    } catch (e) {
      toast(e.message || "Revoke failed");
    }
  }

  const rows = (data && data.consents) || [];

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-head">
          <h3>{t("issueConsent")}</h3>
        </div>
        <div style={{ padding: 16 }}>
          <form onSubmit={issue}>
            <div className="field-group">
              <label>ULPIN</label>
              <input value={form.ulpin} onChange={(e) => setForm({ ...form, ulpin: e.target.value })} required style={{ fontFamily: "var(--font-mono)" }} />
            </div>
            <div className="field-group">
              <label>Granted to</label>
              <input value={form.grantedTo} onChange={(e) => setForm({ ...form, grantedTo: e.target.value })} placeholder="e.g. State Bank of India" required />
            </div>
            <div className="field-group">
              <label>Scope</label>
              <div className="chiprow">
                {SCOPE_OPTIONS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={form.scope.includes(s) ? "chip on" : "chip"}
                    onClick={() => toggleScope(s)}
                    style={form.scope.includes(s) ? { background: "var(--tint)", borderColor: "#c7e6d6" } : null}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>Valid for (days)</label>
              <input type="number" min="1" value={form.ttlDays} onChange={(e) => setForm({ ...form, ttlDays: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
              {busy ? "…" : t("issueConsent")}
            </button>
          </form>
          {issued ? (
            <div className="verify-result valid" style={{ marginTop: 14 }}>
              <div className="vr-top" style={{ fontSize: 14 }}>Token issued</div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, margin: 0, wordBreak: "break-all" }}>{issued.token}</p>
              <p style={{ fontSize: 12, margin: "6px 0 0", color: "var(--ink-soft)" }}>
                Paste this in the Parcel Explorer to unlock {issued.scope.join(", ")}.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Consent registry · {rows.length}</h3>
          <div className="tools">
            <button className="btn btn-line btn-sm" onClick={reload}>Refresh</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Token</th>
                <th>Parcel</th>
                <th>Scope</th>
                <th>State</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading">Loading…</div></td></tr>
              ) : err ? (
                <tr><td colSpan={5}><div className="empty-state">{err}</div></td></tr>
              ) : rows.length ? (
                rows.map((c) => (
                  <tr key={c.token}>
                    <td className="mono-cell" style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{c.token}</td>
                    <td className="mono-cell">{c.ulpin}</td>
                    <td style={{ fontSize: 12 }}>{(c.scope || []).join(", ")}</td>
                    <td>
                      <span className={`pill ${c.valid ? "ok" : "risk"}`}>{c.revoked ? "revoked" : c.valid ? "valid" : "expired"}</span>
                    </td>
                    <td>
                      {!c.revoked ? (
                        <button className="btn btn-line btn-sm" onClick={() => revoke(c.token)}>{t("revoke")}</button>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5}><div className="empty-state">No consents issued yet.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Audit trail
// ===========================================================================
function Audit() {
  const { data, loading, err } = useAsync(() => api.audit.list({ limit: 120 }), []);
  if (loading) return <div className="loading">Loading audit trail…</div>;
  if (err)
    return (
      <div className="empty-state">
        {/401|403|forbidden|role/i.test(err) ? "The audit trail is restricted to Administrator / National Steward accounts." : err}
      </div>
    );
  const rows = (data && data.entries) || [];
  return (
    <div className="card">
      <div className="card-head">
        <h3>Immutable audit trail · {rows.length}</h3>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={e._id || i}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(e.at)}</td>
                <td className="mono-cell">{e.action}</td>
                <td>{e.actor ? `${titleCase(e.actor.role || "system")}` : "system"}</td>
                <td className="mono-cell">{e.target ? `${e.target.type}:${e.target.id || ""}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// Schema mapping playground
// ===========================================================================
function Mapping() {
  const toast = useToast();
  const { data } = useAsync(() => api.mapping.list(), []);
  const [key, setKey] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);

  const profiles = (data && data.profiles) || [];

  useEffect(() => {
    if (!key && profiles.length) setKey(profiles[0].key);
  }, [profiles, key]);

  const loadProfile = useCallback(async (k) => {
    if (!k) return;
    try {
      const p = await api.mapping.get(k);
      setInput(JSON.stringify(p.sampleIn || {}, null, 2));
      setOutput(null);
    } catch (e) {
      toast(e.message || "Could not load profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (key) loadProfile(key);
  }, [key, loadProfile]);

  async function apply() {
    setBusy(true);
    try {
      let record;
      try {
        record = JSON.parse(input);
      } catch {
        toast("Input is not valid JSON");
        setBusy(false);
        return;
      }
      const res = await api.mapping.apply(key, record);
      setOutput(res);
    } catch (e) {
      toast(e.message || "Apply failed (needs an ingest-capable role)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Schema mapping (legacy → canonical)</h3>
        <div className="tools">
          <select className="inline-select" value={key} onChange={(e) => setKey(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.key} value={p.key}>
                {p.sourceName} ({p.fields} fields)
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={apply} disabled={busy || !key}>
            {busy ? "…" : "Transform →"}
          </button>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div className="play">
          <div>
            <div className="catalogue-tier">Legacy record (editable JSON)</div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
          </div>
          <div>
            <div className="catalogue-tier">Canonical output</div>
            <pre>{output ? JSON.stringify(output.output, null, 2) : "— transform to see canonical parcel fragment —"}</pre>
          </div>
        </div>
        {output && output.trace ? (
          <div className="factors" style={{ marginTop: 14 }}>
            <div className="catalogue-tier">Field trace</div>
            {output.trace.map((tr, i) => (
              <div className="f" key={i}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {tr.source} → {tr.target}
                  {tr.transform && tr.transform !== "identity" ? (
                    <em style={{ color: "var(--ink-faint)", fontStyle: "normal" }}> · {tr.transform}</em>
                  ) : null}
                </span>
                <span className="pts">{typeof tr.value === "object" ? JSON.stringify(tr.value) : String(tr.value)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ===========================================================================
// Layer catalogue
// ===========================================================================
function Catalogue() {
  const { data, loading, err } = useAsync(() => api.layers.list(), []);
  if (loading) return <div className="loading">Loading catalogue…</div>;
  if (err) return <div className="empty-state">{err}</div>;
  const tiers = (data && data.tiers) || {};
  const TIER_TITLES = { base: "Base layer", essential: "Essential layer", usecase: "Use-case layer" };

  return (
    <div>
      {["base", "essential", "usecase"].map((tier) => (
        <div key={tier}>
          <div className="catalogue-tier">{TIER_TITLES[tier]}</div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Layer</th>
                    <th>Steward</th>
                    <th>Formats</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {(tiers[tier] || []).map((l) => (
                    <tr key={l.key}>
                      <td>
                        <b>{l.name}</b>
                        <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{l.description}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{l.steward || "—"}</td>
                      <td style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>{(l.formats || []).join(", ") || "—"}</td>
                      <td>
                        <span className={`pill ${l.access === "public" ? "ok" : l.access === "restricted" ? "risk" : "warn"}`}>
                          {l.access || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// Console shell
// ===========================================================================
const TABS = [
  { key: "kpis", label: "kpis", el: Overview },
  { key: "queue", label: "queue", el: Queue },
  { key: "geo", label: "geoTab", el: GeoIntel },
  { key: "consent", label: "consentTab", el: ConsentRegistry },
  { key: "audit", label: "auditTab", el: Audit },
  { key: "mapping", label: "mappingTab", el: Mapping },
  { key: "catalogue", label: "catalogueTab", el: Catalogue },
];

export default function Console() {
  const { t } = useLang();
  const { user, ready, isStaff } = useAuth();
  const [tab, setTab] = useState("kpis");

  if (!ready) return <div className="console"><div className="loading">…</div></div>;
  if (!isStaff)
    return (
      <div className="console">
        <div className="console-inner">
          <Login />
        </div>
      </div>
    );

  const Active = (TABS.find((x) => x.key === tab) || TABS[0]).el;

  return (
    <div className="console">
      <div className="console-inner">
        <div className="console-head">
          <h1>{t("consoleTitle")}</h1>
          <div className="who">
            <b>{user.name}</b>
            <span className="pill neutral">{ROLE_LABELS[user.role] || user.role}</span>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((x) => (
            <button key={x.key} className={tab === x.key ? "on" : ""} onClick={() => setTab(x.key)}>
              {t(x.label)}
            </button>
          ))}
        </div>

        <Active />
      </div>
    </div>
  );
}
