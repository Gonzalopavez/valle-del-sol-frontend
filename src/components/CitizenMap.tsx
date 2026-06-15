import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Incident } from "../types";

// Mapa de SOLO LECTURA para el vecino. No permite arrastrar ni validar.
// Solo muestra los incendios validados (rojo) y mitigados (verde).

function makeIcon(color: string) {
  return L.divIcon({
    className: "custom-pin",
    html: `<span style="background:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const ICON_VALIDATED = makeIcon("#e24b4a");
const ICON_MITIGATED = makeIcon("#639922");

const DEFAULT_CENTER: [number, number] = [-36.8269, -73.0498];

interface CitizenMapProps {
  incidents: Incident[];
}

export default function CitizenMap({ incidents }: CitizenMapProps) {
  // El vecino solo ve incendios validados y mitigados.
  const visibles = incidents.filter(
    (i) => i.status === "VALIDATED" || i.status === "MITIGATED"
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {visibles.map((inc) => {
        if (!inc.id) return null;
        const icon = inc.status === "MITIGATED" ? ICON_MITIGATED : ICON_VALIDATED;
        return (
          <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={icon}>
            <Popup>
              <strong>{inc.description}</strong>
              <br />
              {inc.status === "MITIGATED" ? "Incendio controlado" : "Incendio activo"}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}