# Valle del Sol — Frontend

Interfaz web del Sistema de Gestion de Emergencias de la Municipalidad Valle del Sol.
Construido con **React + TypeScript + Vite**, mapas con **React-Leaflet + OpenStreetMap**.

## Que incluye

- **Vista del vecino** (`/`): formulario para reportar un incendio (descripcion, foto por URL, ubicacion GPS capturada por el navegador). Pensada para movil.
- **Panel del administrador** (`/admin`): mapa con los reportes, pines de color por estado, **pin arrastrable** para corregir coordenadas, validacion de incidentes y una **alerta de evacuacion** simulada al validar.

## Requisitos previos

- Node.js 18 o superior.
- El **backend levantado** con Docker (`docker-compose up --build`), con el BFF escuchando en `http://localhost:8080`.

## Como correrlo

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`.
- Vecino: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin`

## Conexion con el backend

Todo pasa por el **BFF (puerto 8080)**, que actua como puerta de entrada unica:

| Accion | Metodo y ruta |
|---|---|
| Crear reporte | `POST /api/bff/incidents` |
| Listar reportes | `GET /api/bff/incidents` |
| Validar / corregir | `PUT /api/bff/incidents/{id}` |
| Enviar ubicacion | `POST /api/bff/geo/location` |

La URL base esta centralizada en `src/services/api.ts` (constante `BFF_BASE_URL`).

## Notas de diseno

- La **foto** se guarda como una URL de texto (`imageUrl`), igual que en el backend. No hay subida de archivos.
- La **alerta de evacuacion** es una notificacion simulada en el frontend (no existe un servicio de push en el backend). Aparece al validar un reporte.
- El admin entra directo, sin login, segun lo definido para esta entrega.

## Estructura

```
src/
  pages/        CitizenView (vecino) y AdminView (admin)
  components/   MapView, Toast, useToasts
  services/     api.ts (conexion al BFF) y geolocation.ts (GPS del navegador)
  types/        moldes de datos (DTO del frontend)
  styles/       global.css (sistema de diseno)
```
