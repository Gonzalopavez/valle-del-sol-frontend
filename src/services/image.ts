// Convierte una imagen seleccionada a una cadena base64 redimensionada.
// Redimensionar evita que una foto gigante reviente la base de datos
// o haga lento el sistema. Es nuestra defensa contra archivos enormes.

const MAX_DIMENSION = 800; // ancho/alto maximo en pixeles
const JPEG_QUALITY = 0.7;

export interface ProcessedImage {
  dataUrl: string; // la imagen lista para enviar (base64)
  sizeKb: number;
}

// Solo aceptamos estos tipos de imagen, nada de videos ni otros archivos.
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

export function esImagenValida(file: File): boolean {
  return TIPOS_PERMITIDOS.includes(file.type);
}

export function procesarImagen(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (!esImagenValida(file)) {
      reject(new Error("Solo se permiten imagenes (JPG, PNG o WEBP)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen valida."));
      img.onload = () => {
        // Calculamos el nuevo tamaño manteniendo la proporcion.
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
