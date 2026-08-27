import { useRef, useEffect } from "react";
import { drawQR } from "../lib/qr.js";
import { BrandMark } from "../ui.jsx";
import { fmtArea, fmtDateTime } from "../lib/format.js";
import { useLang } from "../lang.jsx";

export function QRCanvas({ value, size = 104 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) drawQR(ref.current, value || "LAND-STACK");
  }, [value]);
  return <canvas ref={ref} width={size} height={size} />;
}

/**
 * The ownership certificate card. Shared by the citizen "verify ownership"
 * modal and the public verify-a-record result. `verified` shows the stamp;
 * `recordId` (when present) is what the QR encodes and what verifies.
 */
export default function Certificate({ recordId, snapshot = {}, issuedAt, verified = false, scanLabel }) {
  const { t } = useLang();
  const owners = snapshot.ownerNames || snapshot.owners || "—";
  const encumbrance = snapshot.encumbranceStatus || snapshot.encumbrance || "—";
  const qrValue = recordId
    ? `${location.origin}/verify?id=${recordId}`
    : `ULPIN:${snapshot.ulpin || ""}`;

  return (
    <div className="cert">
      <div className="ctop">
        <BrandMark className="mark" light />
        <div>
          <div className="t">{t("ownershipRecord")}</div>
          <div className="s">Land Stack · {t("pilot")}</div>
        </div>
      </div>

      <div className="cmid">
        <div className="info">
          <div className="crow">
            <div className="k">{t("cParcel")}</div>
            <div className="v mono">{snapshot.ulpin || "—"}</div>
          </div>
          <div className="crow">
            <div className="k">{t("cOwners")}</div>
            <div className="v">{owners}</div>
          </div>
          <div className="crow">
            <div className="k">{t("cAddress")}</div>
            <div className="v">
              {snapshot.address || [snapshot.sector, snapshot.state].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
          {snapshot.area ? (
            <div className="crow">
              <div className="k">{t("area")}</div>
              <div className="v">{fmtArea(snapshot.area)}</div>
            </div>
          ) : null}
          <div className="crow">
            <div className="k">{t("cEncumbrance")}</div>
            <div className="v">{encumbrance}</div>
          </div>
          {recordId ? (
            <div className="crow">
              <div className="k">{t("cRecordId")}</div>
              <div className="v mono">{recordId}</div>
            </div>
          ) : null}
          <div className="crow" style={{ borderBottom: "none" }}>
            <div className="k">{t("cIssued")}</div>
            <div className="v">{issuedAt ? fmtDateTime(issuedAt) : t("cValidityVal")}</div>
          </div>
        </div>

        <div className="qr">
          <QRCanvas value={qrValue} />
          <div className="lbl">{scanLabel || t("scanVerify")}</div>
        </div>
      </div>

      {verified ? <div className="verified-stamp">{t("verified")}</div> : null}
      <div className="cfoot">{t("certFoot")}</div>
    </div>
  );
}
