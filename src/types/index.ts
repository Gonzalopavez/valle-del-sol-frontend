// Estos tipos son los "moldes" (DTO) del lado del frontend.
// Reflejan exactamente lo que el backend espera y devuelve.

export type IncidentStatus = "PENDING" | "VALIDATED" | "MITIGATED" | "CLOSED";

// Molde del incidente. Coincide con IncidentDTO del bff-service.
export interface Incident {
  id?: string;
  userId: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status?: IncidentStatus;
  createdAt?: string;
}

// Molde para crear un reporte nuevo (lo que envia el vecino).
export interface NewIncident {
  userId: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

// Molde de la ubicacion del vecino. Coincide con UserLocationDTO del bff-service.
export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  deviceId: string;
}
