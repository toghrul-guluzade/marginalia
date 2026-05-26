import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Render page 1 of a PDF to a small JPEG data URL, and report the page count.
 * Used for library grid thumbnails (cached in localStorage by the caller).
 */
export async function generateThumbnail(
  source: ArrayBuffer | string,
  targetWidth = 240,
): Promise<{ dataUrl: string; pageCount: number }> {
  const doc = await pdfjsLib.getDocument(source).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = targetWidth / base.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.7), pageCount: doc.numPages };
  } finally {
    doc.destroy();
  }
}

const THUMB_PREFIX = "research-studio-thumb-";

export function cacheThumbnail(docId: string, dataUrl: string) {
  try {
    localStorage.setItem(THUMB_PREFIX + docId, dataUrl);
  } catch {
    /* quota — ignore, card falls back to placeholder */
  }
}

export function getCachedThumbnail(docId: string): string | null {
  return localStorage.getItem(THUMB_PREFIX + docId);
}

export function removeCachedThumbnail(docId: string) {
  localStorage.removeItem(THUMB_PREFIX + docId);
}
