import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { Incident } from "../types";

function makeIcon(color: string) {
  return L.divIcon({
    className: "custom-pin",
    html: `<span style="background:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const ICON_PENDING = makeIcon("#ef9f27");
const ICON_VALIDATED = makeIcon("#e24b4a");
const ICON_MITIGATED = makeIcon("#639922");
const ICON_SELECTED = makeIcon("#185fa5");

const DEFAULT_CENTER: [number, number] = [-36.8269, -73.0498];

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface MapViewProps {
  incidents: Incident[];
  selectedId: string | null;
  draftCoords: { lat: number; lng: number } | null;
  onSelect: (incident: Incident) => void;
  onDragPin: (lat: number, lng: number) => void;
}

export default function MapView({
  incidents,
  selectedId,
  draftCoords,
  onSelect,
  onDragPin,
}: MapViewProps) {
  const selected = incidents.find((i) => i.id === selectedId) || null;
  const center: [number, number] = selected
    ? [selected.latitude, selected.longitude]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {incidents.map((inc) => {
        if (!inc.id) return null;
        const isSelected = inc.id === selectedId;

        // Solo los PENDING seleccionados se pueden arrastrar para corregir.
        const arrastrable = isSelected && inc.status === "PENDING";

        const pos: [number, number] =
          isSelected && draftCoords && arrastrable
            ? [draftCoords.lat, draftCoords.lng]
            : [inc.latitude, inc.longitude];

        const icon = isSelected
          ? ICON_SELECTED
          : inc.status === "VALIDATED"
          ? ICON_VALIDATED
          : inc.status === "MITIGATED"
          ? ICON_MITIGATED
          : ICON_PENDING;

        return (
          <Marker
            key={inc.id}
            position={pos}
            icon={icon}
            draggable={arrastrable}
            eventHandlers={{
              click: () => onSelect(inc),
              dragend: (e) => {
                const m = e.target as L.Marker;
                const p = m.getLatLng();
                onDragPin(p.lat, p.lng);
              },
            }}
          >
            <Popup>
              <strong>{inc.description}</strong>
              <br />
              {inc.status}
            </Popup>
          </Marker>
        );
      })}

      {selected && draftCoords && selected.status === "PENDING" && (
        <Recenter lat={draftCoords.lat} lng={draftCoords.lng} />
      )}
    </MapContainer>
  );
}
