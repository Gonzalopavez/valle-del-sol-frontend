import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createIncident, sendUserLocation, getAllIncidents } from "../services/api";
import { getCurrentPosition, type Coordinates } from "../services/geolocation";
import { procesarImagen, esImagenValida } from "../services/image";
import { useToasts } from "../components/useToasts";
import CitizenMap from "../components/CitizenMap";
import type { Incident } from "../types";
import "./CitizenView.css";

const VECINO_ID = "vecino_" + Math.floor(1000 + Math.random() * 9000);
const DEVICE_ID = "device_" + Math.floor(1000 + Math.random() * 9000);
const MAX_DESC = 100; // limite de caracteres de la descripcion

export default function CitizenView() {
  const { showToast, ToastContainer } = useToasts();

  const [description, setDescription] = useState("");
  const [imageData, setImageData] = useState<string>(""); // base64 de la foto
  const [imageName, setImageName] = useState<string>("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // modal central de exito
  const [tab, setTab] = useState<"reportar" | "mapa">("reportar");
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    capturarUbicacion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando el vecino entra a la pestana mapa, cargamos los incidentes y refrescamos cada 8s.
  useEffect(() => {
    if (tab !== "mapa") return;
    let activo = true;
    const cargar = () => {
      getAllIncidents().then((data) => { if (activo) setIncidents(data); }).catch(() => {});
    };
    cargar();
    const intervalo = setInterval(cargar, 8000);
    return () => { activo = false; clearInterval(intervalo); };
  }, [tab]);

  async function capturarUbicacion(silencioso = false) {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCoords(pos);
      sendUserLocation({
        userId: VECINO_ID,
        latitude: pos.latitude,
        longitude: pos.longitude,
        deviceId: DEVICE_ID,
      }).catch(() => {});
    } catch (err) {
      if (!silencioso) showToast("error", "Ubicacion", (err as Error).message);
    } finally {
      setLocating(false);
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!esImagenValida(file)) {
      showToast("error", "Archivo no valido", "Solo se permiten imagenes (JPG, PNG o WEBP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const result = await procesarImagen(file);
      setImageData(result.dataUrl);
      setImageName(file.name);
    } catch (err) {
      showToast("error", "Imagen", (err as Error).message);
    }
  }

  function quitarImagen() {
    setImageData("");
    setImageName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function enviarReporte() {
    if (!description.trim()) {
      showToast("error", "Falta la descripcion", "Cuentanos que estas viendo.");
      return;
    }
    if (!coords) {
      showToast("error", "Falta tu ubicacion", "Captura tu ubicacion antes de enviar.");
      return;
    }

    setSending(true);
    try {
      await createIncident({
        userId: VECINO_ID,
        description: description.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        imageUrl: imageData || "https://valle-del-sol.cl/sin-foto.jpg",
      });
      setShowSuccess(true); // mostramos el modal central
      setDescription("");
      quitarImagen();
    } catch (err) {
      showToast("error", "No se pudo enviar", (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="citizen-wrap">
      <ToastContainer />

      {/* Modal central de exito */}
      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{"\u2713"}</div>
            <h3 className="modal-title">Reporte enviado</h3>
            <p className="modal-text">Gracias. La municipalidad revisara tu reporte.</p>
            <p className="modal-alert">
              No olvides llamar a Bomberos en caso de emergencia: <strong>132</strong>
            </p>
            <button className="btn btn-danger btn-block" onClick={() => setShowSuccess(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="citizen-phone">
        <header className="citizen-header">
          <div className="citizen-logo">
            <span className="citizen-logo-mark">VS</span>
          </div>
          <div>
            <p className="citizen-title">Valle del Sol</p>
            <p className="citizen-subtitle">Reporta una emergencia</p>
          </div>
          <Link to="/admin" className="citizen-admin-link" title="Ir al panel">
            Admin
          </Link>
        </header>

        <div className="citizen-tabs">
          <button className={`citizen-tab ${tab === "reportar" ? "activo" : ""}`} onClick={() => setTab("reportar")}>Reportar</button>
          <button className={`citizen-tab ${tab === "mapa" ? "activo" : ""}`} onClick={() => setTab("mapa")}>Ver mapa</button>
        </div>

        {tab === "reportar" && (
        <div className="citizen-body">
          <label className="field-label">Descripcion del fuego</label>
          <textarea
            rows={3}
            maxLength={MAX_DESC}
            placeholder="Ej: Humo en el cerro"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
          />
          <p className="char-counter">
            {description.length}/{MAX_DESC} caracteres
          </p>

          <label className="field-label">Fotografia</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={onFileSelected}
          />

          {!imageData ? (
            <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon">{"\u{1F4F7}"}</div>
              <span className="upload-text">Toca para adjuntar una foto</span>
              <span className="upload-hint">Solo imagenes (JPG, PNG, WEBP)</span>
            </div>
          ) : (
            <div className="image-preview">
              <img src={imageData} alt="Vista previa" />
              <div className="image-preview-info">
                <span className="image-name">{imageName}</span>
                <button className="image-remove" onClick={quitarImagen}>
                  Quitar imagen
                </button>
              </div>
            </div>
          )}

          <label className="field-label">Tu ubicacion</label>
          <div className={`location-box ${coords ? "located" : ""}`}>
            <div className="location-pin">{coords ? "\u2713" : "\u25CB"}</div>
            <div className="location-info">
              {coords ? (
                <>
                  <p className="location-coords">
                    {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                  </p>
                  <p className="location-accuracy">
                    Capturada por GPS · precision {Math.round(coords.accuracy)} m
                  </p>
                </>
              ) : (
                <p className="location-coords">Sin ubicacion todavia</p>
              )}
            </div>
          </div>
          <button
            className="btn btn-blocktwo"
            style={{ marginTop: 8 }}
            onClick={() => capturarUbicacion(false)}
            disabled={locating}
          >
            {locating ? "Buscando..." : "Volver a capturar ubicacion"}
          </button>

          <button
            className="btn btn-danger btn-block"
            style={{ marginTop: 16, padding: "12px" }}
            onClick={enviarReporte}
            disabled={sending}
          >
            {sending ? "Enviando..." : "Enviar reporte"}
          </button>

          <p className="citizen-footnote">
            Tu reporte llegara como pendiente y sera revisado por la municipalidad
            antes de activar alertas.
          </p>
        </div>
        )}

        {tab === "mapa" && (
          <div className="citizen-map-box">
            <CitizenMap incidents={incidents} />
          </div>
        )}
      </div>
    </div>
  );
}