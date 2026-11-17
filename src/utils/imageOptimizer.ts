/**
 * Optimiza una imagen para enviarla a modelos de Visión IA (Gemini Vision).
 * Reduce la resolución a una dimensión máxima prudente (ej. 1200px) y
 * comprime a JPEG ~0.82 para evitar superar los límites de payload (4.5 MB de Vercel).
 * 
 * Dado que el sistema usa coordenadas normalizadas (0 a 1000), la reducción de
 * escala no afecta en absoluto la precisión de las posiciones relativas (x, y, w, h).
 */
export async function optimizeImageForAi(
  dataUrl: string,
  maxDimension: number = 1200,
  quality: number = 0.82
): Promise<{ dataUrl: string; mimeType: string }> {
  // Si no es un dataUrl válido o es muy corto, devolver tal cual
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { dataUrl, mimeType: 'image/png' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Calcular nueva escala manteniendo la relación de aspecto
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dataUrl, mimeType: 'image/png' });
        return;
      }

      // Fondo blanco para imágenes transparentes (PNGs arquitectónicos)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Dibujar imagen reescalada
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar en JPEG optimizado (ocupa típicamente 100-250 KB vs 15 MB)
      const optimizedJpeg = canvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl: optimizedJpeg,
        mimeType: 'image/jpeg',
      });
    };

    img.onerror = () => {
      // Si falla la carga del elemento Image, devolver original
      resolve({ dataUrl, mimeType: 'image/png' });
    };

    img.src = dataUrl;
  });
}
