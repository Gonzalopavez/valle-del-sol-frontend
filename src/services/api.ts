import type { Incident, NewIncident, UserLocation, IncidentStatus } from "../types";

// El BFF es la puerta de entrada unica. Todo pasa por el puerto 8080.
const BFF_BASE_URL = "http://localhost:8080/api/bff";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// 1. Crear un reporte de incidente (lo usa el vecino).
export async function createIncident(incident: NewIncident): Promise<Incident> {
  const res = await fetch(`${BFF_BASE_URL}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(incident),
  });
  return handleResponse<Incident>(res);
}

// 2. Obtener todos los incidentes (lo usa el panel admin).
export async function getAllIncidents(): Promise<Incident[]> {
  const res = await fetch(`${BFF_BASE_URL}/incidents`);
  return handleResponse<Incident[]>(res);
}

// 3. Validar / corregir / mitigar un incidente (lo usa el admin).
export async function updateIncident(
  id: string,
  latitude: number,
  longitude: number,
  status: IncidentStatus
): Promise<Incident> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    status,
  });
  const res = await fetch(`${BFF_BASE_URL}/incidents/${id}?${params.toString()}`, {
    method: "PUT",
  });
  return handleResponse<Incident>(res);
}

// 4. Eliminar / cancelar un incidente (lo usa el admin).
export async function deleteIncident(id: string): Promise<void> {
  const res = await fetch(`${BFF_BASE_URL}/incidents/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
}

// 5. Enviar la ubicacion del vecino (Paso 0).
export async function sendUserLocation(location: UserLocation): Promise<unknown> {
  const res = await fetch(`${BFF_BASE_URL}/geo/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(location),
  });
  return handleResponse<unknown>(res);
}
