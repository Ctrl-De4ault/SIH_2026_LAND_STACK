import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import maplibregl from "maplibre-gl";
import { LANDUSE_COLORS, LANDUSE_FALLBACK, landUseColor, MAP_CENTER, MAP_ZOOM } from "../lib/format.js";
import api from "../api.js";

const BASEMAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-saturation": -0.68,
        "raster-opacity": 0.86,
        "raster-brightness-min": 0.04,
        "raster-contrast": -0.06,
      },
    },
  ],
};

function fillColorExpr() {
  const expr = ["match", ["get", "landUse"]];
  Object.keys(LANDUSE_COLORS).forEach((k) => expr.push(k, LANDUSE_COLORS[k]));
  expr.push(LANDUSE_FALLBACK);
  return expr;
}

const MapView = forwardRef(function MapView({ onSelect, selectedUlpin, onFeatures, onPointInspect }, ref) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const byUlpin = useRef(new Map());
  const hoverPopup = useRef(null);
  const hoverId = useRef(null);
  const selRef = useRef(null);
  const pinMarkerRef = useRef(null);
  const [error, setError] = useState("");

  // Imperative API for the parent (search → fly + select).
  useImperativeHandle(ref, () => ({
    selectUlpin(ulpin, fly = true) {
      const feat = byUlpin.current.get(ulpin);
      if (!feat) return;
      clearPin();
      applySelected(ulpin);
      if (fly && feat.properties.centroid) {
        const c = feat.properties.centroid;
        const center = Array.isArray(c) ? c : c.coordinates;
        if (center) mapRef.current.flyTo({ center, zoom: Math.max(mapRef.current.getZoom(), 16.2), duration: 700 });
      }
      onSelect && onSelect(feat);
    },
    getFeature: (ulpin) => byUlpin.current.get(ulpin),
    allFeatures: () => Array.from(byUlpin.current.values()),
    clearInspectPin: () => clearPin(),
  }));

  function clearPin() {
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
  }

  function dropPin(lngLat) {
    clearPin();
    const el = document.createElement("div");
    el.className = "inspect-pin";
    pinMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(lngLat)
      .addTo(mapRef.current);
  }

  function applySelected(ulpin) {
    const map = mapRef.current;
    if (!map) return;
    if (selRef.current) map.setFeatureState({ source: "parcels", id: selRef.current }, { selected: false });
    selRef.current = ulpin;
    if (ulpin) map.setFeatureState({ source: "parcels", id: ulpin }, { selected: true });
  }

  // Reflect external selection changes (e.g. panel closed → selectedUlpin null).
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) applySelected(selectedUlpin || null);
  }, [selectedUlpin]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: BASEMAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    hoverPopup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: "ls-pop",
    });

    map.on("load", async () => {
      let fc;
      try {
        fc = await api.parcels.list();
      } catch (e) {
        setError(e.message || "Could not load parcels");
        return;
      }
      const features = (fc && fc.features) || [];
      features.forEach((f) => byUlpin.current.set(f.properties.ulpin, f));
      onFeatures && onFeatures(features);

      map.addSource("parcels", { type: "geojson", data: fc });
      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": fillColorExpr(),
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.74,
            ["boolean", ["feature-state", "hover"], false],
            0.64,
            0.48,
          ],
        },
      });
      map.addLayer({
        id: "parcels-line",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#C9942B",
            "#1C5348",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3.6,
            ["boolean", ["feature-state", "hover"], false],
            2.0,
            1.0,
          ],
          "line-opacity": 0.9,
        },
      });

      map.on("mousemove", "parcels-fill", (e) => {
        if (!e.features.length) return;
        map.getCanvas().style.cursor = "pointer";
        const f = e.features[0];
        if (hoverId.current && hoverId.current !== f.id)
          map.setFeatureState({ source: "parcels", id: hoverId.current }, { hover: false });
        hoverId.current = f.id;
        map.setFeatureState({ source: "parcels", id: f.id }, { hover: true });
        const p = f.properties;
        const sw = landUseColor(p.landUse);
        hoverPopup.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:#14332C">` +
              `<span style="display:inline-block;width:8px;height:8px;border-radius:3px;background:${sw};margin-right:6px"></span>` +
              `${p.ulpin}</div>` +
              `<div style="font-family:Hanken Grotesk,sans-serif;font-size:12px;color:#5C6E67;margin-top:2px">${p.landUse} · ${p.sector}</div>`
          )
          .addTo(map);
      });
      map.on("mouseleave", "parcels-fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoverId.current) map.setFeatureState({ source: "parcels", id: hoverId.current }, { hover: false });
        hoverId.current = null;
        hoverPopup.current.remove();
      });
      map.on("click", "parcels-fill", (e) => {
        if (!e.features.length) return;
        e._parcelHandled = true;
        clearPin();
        const ulpin = e.features[0].id;
        const raw = byUlpin.current.get(ulpin);
        applySelected(ulpin);
        onSelect && onSelect(raw || e.features[0]);
      });

      // Map-level click: fires for empty areas (not on a parcel).
      map.on("click", (e) => {
        // Skip if a parcel was clicked (handled above).
        if (e._parcelHandled) return;
        // Check if click was on a parcel feature.
        const parcelFeatures = map.queryRenderedFeatures(e.point, { layers: ["parcels-fill"] });
        if (parcelFeatures && parcelFeatures.length) return;

        applySelected(null);
        dropPin(e.lngLat);
        onPointInspect && onPointInspect(e.lngLat);
      });
    });

    map.on("error", (ev) => {
      // Basemap tile errors (offline) are non-fatal — parcels still render.
      if (ev && ev.error && /tile/i.test(ev.error.message || "")) return;
    });

    return () => {
      clearPin();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="map" ref={mapEl} />
      {error ? (
        <div className="map-hint" style={{ borderColor: "#F1CDC3", color: "#9A3823" }}>
          <b>API not reachable.</b> {error} Start the server on <code>:8080</code> and reload.
        </div>
      ) : null}
    </>
  );
});

export default MapView;
