import { useRef, useState, useCallback } from "react";
import { useLang } from "../lang.jsx";
import MapView from "../components/MapView.jsx";
import SearchBox from "../components/SearchBox.jsx";
import ParcelPanel from "../components/ParcelPanel.jsx";
import LocationPanel from "../components/LocationPanel.jsx";
import { CertificateModal, ServiceRequestModal, TrackRequestModal } from "../components/CitizenModals.jsx";

export default function CitizenPortal() {
  const { t } = useLang();
  const mapRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [selected, setSelected] = useState(null); // raw GeoJSON feature
  const [panelOpen, setPanelOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'cert' | 'service' | 'track'
  const [modalParcel, setModalParcel] = useState(null);
  const [lastFiledId, setLastFiledId] = useState("");
  const [hintDismissed, setHintDismissed] = useState(false);

  // Point Inspector state
  const [inspectPoint, setInspectPoint] = useState(null); // { lng, lat }
  const [inspectOpen, setInspectOpen] = useState(false);

  const handleSelect = useCallback((feature) => {
    // Close LocationPanel when a parcel is selected.
    setInspectOpen(false);
    setInspectPoint(null);
    setSelected(feature);
    setPanelOpen(true);
  }, []);

  const handlePointInspect = useCallback((lngLat) => {
    // Close ParcelPanel when empty area is clicked.
    setPanelOpen(false);
    setSelected(null);
    setInspectPoint(lngLat);
    setInspectOpen(true);
  }, []);

  const pickUlpin = useCallback((ulpin) => {
    if (mapRef.current) mapRef.current.selectUlpin(ulpin);
  }, []);

  function closePanel() {
    setPanelOpen(false);
    setSelected(null);
  }

  function closeInspect() {
    setInspectOpen(false);
    setInspectPoint(null);
    if (mapRef.current) mapRef.current.clearInspectPin();
  }

  function goToParcel(ulpin) {
    closeInspect();
    if (mapRef.current) mapRef.current.selectUlpin(ulpin);
  }

  const selectedUlpin = selected && (selected.id || (selected.properties && selected.properties.ulpin));

  return (
    <div className="explorer">
      <div className="map-wrap">
        <MapView
          ref={mapRef}
          onSelect={handleSelect}
          onFeatures={setFeatures}
          onPointInspect={handlePointInspect}
          selectedUlpin={panelOpen ? selectedUlpin : null}
        />

        <div className="overlay-top">
          <SearchBox features={features} onPick={pickUlpin} />
        </div>

        {!panelOpen && !inspectOpen && !hintDismissed ? (
          <div className="map-hint">
            <button className="x" onClick={() => setHintDismissed(true)} aria-label="Dismiss">
              ×
            </button>
            <b>{t("hintTitle")}</b>
            <div>{t("hintBody")}</div>
          </div>
        ) : null}
      </div>

      <ParcelPanel
        feature={selected}
        open={panelOpen}
        onClose={closePanel}
        onVerify={(parcel) => {
          setModalParcel(parcel);
          setModal("cert");
        }}
        onApply={(parcel) => {
          setModalParcel(parcel);
          setModal("service");
        }}
        onTrack={() => setModal("track")}
      />

      <LocationPanel
        lngLat={inspectPoint}
        features={features}
        open={inspectOpen}
        onClose={closeInspect}
        onGoToParcel={goToParcel}
      />

      {modal === "cert" && modalParcel ? (
        <CertificateModal parcel={modalParcel} onClose={() => setModal(null)} />
      ) : null}
      {modal === "service" && modalParcel ? (
        <ServiceRequestModal
          parcel={modalParcel}
          onClose={() => setModal(null)}
          onFiled={(res) => setLastFiledId(res.requestId)}
        />
      ) : null}
      {modal === "track" ? (
        <TrackRequestModal initialId={lastFiledId} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

