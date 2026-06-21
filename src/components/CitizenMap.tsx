import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";
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

// Icono del circulo azul de "mi ubicacion".
const ICON_YO = L.divIcon({
  className: "",
  html: `<div class="mi-ubicacion-pin"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const DEFAULT_CENTER: [number, number] = [-36.8269, -73.0498];

interface CitizenMapProps {
  incidents: Incident[];
}

// Boton que pide el GPS y centra el mapa en el usuario.
function BotonEncontrarme({ onUbicar }: { onUbicar: (lat: number, lng: number) => void }) {
  const map = useMap();

  function encontrarme() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onUbicar(latitude, longitude);
        map.setView([latitude, longitude], 15, { animate: true });
      },
      () => alert("No se pudo obtener tu ubicacion."),
      { enableHighAccuracy: true }
    );
  }

  return (
    <button className="btn-encontrarme" onClick={encontrarme}>
      Encontrarme
    </button>
  );
}

export default function CitizenMap({ incidents }: CitizenMapProps) {
  const [miUbicacion, setMiUbicacion] = useState<[number, number] | null>(null);

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

      {miUbicacion && (
        <Marker position={miUbicacion} icon={ICON_YO}>
          <Popup>Estas aqui</Popup>
        </Marker>
      )}

      <BotonEncontrarme onUbicar={(lat, lng) => setMiUbicacion([lat, lng])} />
    </MapContainer>
  );
}
