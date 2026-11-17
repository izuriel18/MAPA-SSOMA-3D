import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface RenderedPdfPage {
  dataUrl: string;
  width: number;
  height: number;
  pageCount: number;
  currentPage: number;
}

export async function renderPdfFilePage(
  file: File,
  pageNumber = 1,
  targetScale = 2.2
): Promise<RenderedPdfPage> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const clampedPage = Math.max(1, Math.min(pageNumber, pdf.numPages));
  const page = await pdf.getPage(clampedPage);

  // Cap max canvas dimensions to avoid memory pressure on huge A0 architectural sheets
  const baseViewport = page.getViewport({ scale: 1 });
  const maxDimension = 2600;
  const maxAllowedScale = Math.min(
    targetScale,
    maxDimension / Math.max(baseViewport.width, baseViewport.height)
  );
  const effectiveScale = Math.max(1, maxAllowedScale);
  const viewport = page.getViewport({ scale: effectiveScale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el lienzo 2D para renderizar el PDF.');
  }

  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    pageCount: pdf.numPages,
    currentPage: clampedPage,
  };
}
