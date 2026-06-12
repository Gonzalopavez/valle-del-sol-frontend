// Captura la ubicacion real del dispositivo usando la Geolocation API del navegador.


export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Tu navegador no permite obtener la ubicacion."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(new Error(traducirError(err.code)));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

function traducirError(code: number): string {
  switch (code) {
    case 1:
      return "Permiso de ubicacion denegado. Activalo para reportar.";
    case 2:
      return "No se pudo determinar tu ubicacion.";
    case 3:
      return "La busqueda de ubicacion tardo demasiado.";
    default:
      return "Error desconocido al obtener la ubicacion.";
  }
}
