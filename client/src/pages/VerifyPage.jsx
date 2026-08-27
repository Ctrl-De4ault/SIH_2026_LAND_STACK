import { useState, useEffect, useCallback } from "react";
import { useLang } from "../lang.jsx";
import api from "../api.js";
import Certificate from "../components/Certificate.jsx";

const SAMPLE_IDS = ["LS-VER-7F3A9C2E", "LS-VER-1B8D4402"];

export default function VerifyPage() {
  const { t } = useLang();
  const [id, setId] = useState("");
  const [state, setState] = useState(null); // {kind:'valid'|'invalid'|'warn', data}
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (rid) => {
      const recordId = (rid != null ? rid : id).trim();
      if (!recordId) return;
      setBusy(true);
      setState(null);
      try {
        const res = await api.certificates.verify(recordId);
        if (res.tamperEvident) setState({ kind: "warn", data: res });
        else if (res.valid) setState({ kind: "valid", data: res });
        else setState({ kind: "invalid", data: res });
      } catch (e) {
        if (e.status === 404) setState({ kind: "invalid", data: { recordId } });
        else setState({ kind: "invalid", data: { recordId, message: e.message } });
      } finally {
        setBusy(false);
      }
    },
    [id]
  );

  // Deep-link support: /verify?id=LS-VER-… (used by the certificate QR).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qid = params.get("id");
    if (qid) {
      setId(qid);
      run(qid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title =
    state && state.kind === "valid"
      ? t("lrValidTitle")
      : state && state.kind === "warn"
      ? t("lrTamperTitle")
      : t("lrInvalidTitle");
  const body =
    state && state.kind === "valid"
      ? t("lrValidBody")
      : state && state.kind === "warn"
      ? t("lrTamperBody")
      : t("lrInvalidBody");

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h1>{t("navVerify")}</h1>
        <p className="verify-intro">{t("verifyIntro")}</p>

        <div className="verify-lookup">
          <div className="field">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="LS-VER-…"
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <button className="btn btn-primary" onClick={() => run()} disabled={busy}>
              {t("check")}
            </button>
          </div>
        </div>

        <div className="hint-ids">
          {t("tryLbl")}{" "}
          {SAMPLE_IDS.map((s) => (
            <code
              key={s}
              onClick={() => {
                setId(s);
                run(s);
              }}
            >
              {s}
            </code>
          ))}
        </div>

        {state ? (
          <div className={`verify-result ${state.kind}`} style={{ marginTop: 18 }}>
            <div className="vr-top">
              <svg className="vr-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {state.kind === "valid" ? (
                  <path d="M20 6 9 17l-5-5" />
                ) : state.kind === "warn" ? (
                  <>
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </>
                )}
              </svg>
              {title}
            </div>
            <p style={{ fontSize: 13.5, margin: "0 0 4px" }}>{body}</p>
            {state.data && state.data.recordId ? (
              <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink-soft)", margin: 0 }}>
                {state.data.recordId}
              </p>
            ) : null}
          </div>
        ) : null}

        {state && (state.kind === "valid" || state.kind === "warn") && state.data.snapshot ? (
          <div style={{ marginTop: 18 }}>
            <Certificate
              recordId={state.data.recordId}
              snapshot={state.data.snapshot}
              issuedAt={state.data.issuedAt}
              verified={state.kind === "valid"}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
