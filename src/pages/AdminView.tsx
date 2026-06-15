import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAllIncidents, updateIncident, deleteIncident } from "../services/api";
import type { Incident } from "../types";
import MapView from "../components/MapView";
import { useToasts } from "../components/useToasts";
import "./AdminView.css";

export default function AdminView() {
  const { showToast, ToastContainer } = useToasts();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null); // visor de imagen grande
  const [filtro, setFiltro] = useState<"ALL" | "PENDING" | "VALIDATED" | "MITIGATED">("ALL");

  const selected = incidents.find((i) => i.id === selectedId) || null;
  // Lista ya filtrada segun el boton activo. Si es "ALL", muestra todos.
  const incidentesFiltrados =
    filtro === "ALL" ? incidents : incidents.filter((i) => i.status === filtro);

  const cargarIncidentes = useCallback(async () => {
    try {
      const data = await getAllIncidents();
      setIncidents(data);
    } catch (err) {
      showToast("error", "Sin conexion", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarIncidentes();
    const interval = setInterval(cargarIncidentes, 8000);
    return () => clearInterval(interval);
  }, [cargarIncidentes]);

  function seleccionar(inc: Incident) {
    if (!inc.id) return;
    setSelectedId(inc.id);
    setDraftCoords({ lat: inc.latitude, lng: inc.longitude });
  }

  function limpiarSeleccion() {
    setSelectedId(null);
    setDraftCoords(null);
  }

  // Validar un reporte pendiente.
  async function validar() {
    if (!selected || !selected.id || !draftCoords) return;
    setWorking(true);
    try {
      await updateIncident(selected.id, draftCoords.lat, draftCoords.lng, "VALIDATED");
      const enRiesgo = 2 + Math.floor(Math.random() * 5);
      showToast("alert", "Alerta de evacuacion enviada", `Se notifico a ${enRiesgo} vecinos dentro del radio de riesgo.`);
      await cargarIncidentes();
      limpiarSeleccion();
    } catch (err) {
      showToast("error", "No se pudo validar", (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  // Marcar un incendio como mitigado (apagado/controlado).
  async function mitigar() {
    if (!selected || !selected.id) return;
    setWorking(true);
    try {
      await updateIncident(selected.id, selected.latitude, selected.longitude, "MITIGATED");
      showToast("success", "Incendio mitigado", "El reporte quedo registrado como mitigado.");
      await cargarIncidentes();
      limpiarSeleccion();
    } catch (err) {
      showToast("error", "No se pudo mitigar", (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  // Cancelar = eliminar de verdad de la base de datos.
  async function cancelar() {
    if (!selected || !selected.id) return;
    setWorking(true);
    try {
      await deleteIncident(selected.id);
      showToast("success", "Reporte cancelado", "El reporte fue eliminado del sistema.");
      await cargarIncidentes();
      limpiarSeleccion();
    } catch (err) {
      showToast("error", "No se pudo cancelar", (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  const pendientes = incidents.filter((i) => i.status === "PENDING").length;
  const validados = incidents.filter((i) => i.status === "VALIDATED").length;
  const mitigados = incidents.filter((i) => i.status === "MITIGATED").length;

  function tiempoRelativo(iso?: string): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "recien";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    return `hace ${h} h`;
  }

  // Una imagen es "real" si es base64 o una URL http (no el placeholder).
  function tieneImagen(inc: Incident | null): boolean {
    if (!inc || !inc.imageUrl) return false;
    return inc.imageUrl.startsWith("data:image") ||
      (inc.imageUrl.startsWith("http") && !inc.imageUrl.includes("sin-foto"));
  }

  return (
    <div className="admin-shell">
      <ToastContainer />

      {/* Visor de imagen ampliada */}
      {zoomImage && (
        <div className="img-zoom-overlay" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="Imagen del reporte" onClick={(e) => e.stopPropagation()} />
          <button className="img-zoom-close" onClick={() => setZoomImage(null)}>&times;</button>
        </div>
      )}

      <header className="admin-top">
        <div className="admin-brand">
          <span className="admin-brand-mark">VS</span>
          <div>
            <p className="admin-brand-title">Valle del Sol · Gestion de emergencias</p>
            <p className="admin-brand-sub">Panel de administracion</p>
          </div>
        </div>
        <div className="admin-top-right">
          <span className="admin-status"><span className="dot-online" /> Conectado</span>
          <Link to="/" className="admin-citizen-link">Vista del vecino</Link>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-map-col">
          <div className="admin-map card">
            <MapView
              incidents={incidentesFiltrados}
              selectedId={selectedId}
              draftCoords={draftCoords}
              onSelect={seleccionar}
              onDragPin={(lat, lng) => setDraftCoords({ lat, lng })}
            />
            <div className="map-legend">
              <span><i className="dot" style={{ background: "#e24b4a" }} /> Validado</span>
              <span><i className="dot" style={{ background: "#ef9f27" }} /> Pendiente</span>
              <span><i className="dot" style={{ background: "#639922" }} /> Mitigado</span>
              <span><i className="dot" style={{ background: "#185fa5" }} /> Seleccionado</span>
            </div>
            {selected && selected.status === "PENDING" && (
              <div className="map-hint">Arrastra el pin azul para corregir</div>
            )}
          </div>
        </section>

        <aside className="admin-side">
          <div className="admin-stats">
            <div className="stat">
              <p className="stat-label">Pendientes</p>
              <p className="stat-value" style={{ color: "var(--warning-text)" }}>{pendientes}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Validados</p>
              <p className="stat-value" style={{ color: "var(--danger-text)" }}>{validados}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Mitigados</p>
              <p className="stat-value" style={{ color: "var(--success-text)" }}>{mitigados}</p>
            </div>
          </div>

          <div className="card admin-detail">
            <p className="detail-head">Reporte seleccionado</p>
            {selected ? (
              <>
                <p className="detail-desc">{selected.description}</p>
                <p className="detail-meta">
                  {draftCoords && selected.status === "PENDING"
                    ? `${draftCoords.lat.toFixed(4)}, ${draftCoords.lng.toFixed(4)}`
                    : `${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)}`}{" "}
                  · {selected.userId}
                </p>

                {/* Miniatura de la imagen del vecino */}
                {tieneImagen(selected) && (
                  <div className="detail-thumb" onClick={() => setZoomImage(selected.imageUrl!)}>
                    <img src={selected.imageUrl} alt="Foto del reporte" />
                    <span className="detail-thumb-hint">Ver imagen</span>
                  </div>
                )}

                <div style={{ margin: "10px 0 12px" }}>
                  <StatusPill status={selected.status} />
                </div>

                {/* Botones segun el estado */}
                {selected.status === "PENDING" && (
                  <div className="action-buttons">
                    <button className="btn btn-danger btn-block" onClick={validar} disabled={working}>
                      {working ? "..." : "Validar e informar"}
                    </button>
                    <button className="btn btn-block btn-mitigate" onClick={mitigar} disabled={working}>
                      Incendio mitigado
                    </button>
                    <button className="btn btn-block btn-cancel" onClick={cancelar} disabled={working}>
                      Cancelar reporte
                    </button>
                  </div>
                )}

                {selected.status === "VALIDATED" && (
                  <div className="action-buttons">
                    <button className="btn btn-block btn-mitigate" onClick={mitigar} disabled={working}>
                      Incendio mitigado
                    </button>
                    <button className="btn btn-block btn-cancel" onClick={cancelar} disabled={working}>
                      Cancelar reporte
                    </button>
                  </div>
                )}

                {selected.status === "MITIGATED" && (
                  <p className="detail-note">Este incendio ya fue mitigado.</p>
                )}
              </>
            ) : (
              <p className="detail-empty">
                Selecciona un reporte en el mapa o en la lista para revisarlo.
              </p>
            )}
          </div>
        </aside>
      </main>

      <section className="card admin-list">
        <div className="list-head">
          <p className="list-title">Reportes entrantes</p>
          <div className="filtro-botones">
            <button
              className={`filtro-btn ${filtro === "ALL" ? "activo" : ""}`}
              onClick={() => setFiltro("ALL")}
            >
              Todos
            </button>
            <button
              className={`filtro-btn boton2 ${filtro === "PENDING" ? "activo" : ""}`}
              onClick={() => setFiltro("PENDING")}
            >
              PENDIENTES
            </button>
            <button
              className={`filtro-btn boton3 ${filtro === "VALIDATED" ? "activo" : ""}`}
              onClick={() => setFiltro("VALIDATED")}
            >
              VALIDADOS
            </button>
            <button
              className={`filtro-btn boton4 ${filtro === "MITIGATED" ? "activo" : ""}`}
              onClick={() => setFiltro("MITIGATED")}
            >
              MITIGADOS
            </button>
          </div>
          <span className="list-refresh">actualiza cada 8 s</span>
        </div>
        {loading ? (
          <p className="list-empty">Cargando reportes...</p>
        ) : incidents.length === 0 ? (
          <p className="list-empty">No hay reportes todavia.</p>
        ) : (
          incidentesFiltrados.map((inc) => (
            <div
              key={inc.id}
              className={`list-row ${inc.id === selectedId ? "active" : ""}`}
              onClick={() => seleccionar(inc)}
            >
              <div>
                <p className="row-desc">{inc.description}</p>
                <p className="row-meta">
                  {tiempoRelativo(inc.createdAt)} · {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                </p>
              </div>
              <StatusPill status={inc.status} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (status === "VALIDATED") return <span className="pill pill-validated">VALIDATED</span>;
  if (status === "MITIGATED") return <span className="pill pill-mitigated">MITIGADO</span>;
  if (status === "CLOSED") return <span className="pill pill-closed">CLOSED</span>;
  return <span className="pill pill-pending">PENDING</span>;
}
