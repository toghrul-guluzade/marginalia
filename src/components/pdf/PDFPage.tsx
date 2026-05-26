import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  /** Document id, used to look up highlights for this page. */
  docId: string;
  /** Zoom multiplier applied on top of the fit-to-width scale. Default 1. */
  zoom?: number;
}

/**
 * A single PDF page rendered as three pixel-aligned layers:
 *   Layer 1 (bottom): <canvas> — the rasterized page
 *   Layer 2 (middle): <svg id="highlight-layer"> — highlight rectangles
 *   Layer 3 (top):    <div class="textLayer"> — transparent selectable text
 *
 * Coordinate note: we work entirely in viewport (top-left origin) space, so no
 * PDF bottom-left Y inversion is needed. Highlights are stored in scale-1.0
 * viewport coordinates and multiplied by `scale` at render time.
 */
export default function PDFPage({ pdf, pageNumber, docId, zoom = 1 }: PDFPageProps) {
  void docId; // used by HighlightLayer in Sprint 2.3
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [availWidth, setAvailWidth] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0, scale: 1 });

  // Measure available width (the column), independent of rendered page size.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setAvailWidth(w);
    });
    observer.observe(el);
    setAvailWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (availWidth === 0) return;
    let renderTask: RenderTask | null = null;
    let cancelled = false;

    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = (availWidth / base.width) * zoom;
      const viewport = page.getViewport({ scale });

      setSize({ width: viewport.width, height: viewport.height, scale });

      // --- Layer 1: canvas at device-pixel-ratio quality ---
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        renderTask = page.render({
          canvas,
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        renderTask.promise.catch((err: unknown) => {
          if (err && typeof err === "object" && "name" in err && err.name === "RenderingCancelledException") return;
          console.error(`Failed to render page ${pageNumber}`, err);
        });
      }

      // --- Layer 3: text layer ---
      const textContainer = textLayerRef.current;
      if (textContainer) {
        textContainer.replaceChildren();
        textContainer.style.setProperty("--scale-factor", String(scale));
        textContainer.style.setProperty("--total-scale-factor", String(scale));
        textContainer.style.width = `${viewport.width}px`;
        textContainer.style.height = `${viewport.height}px`;
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textContainer,
          viewport,
        });
        textLayer.render().catch(() => {
          /* cancelled re-render; ignore */
        });
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, availWidth, zoom]);

  return (
    <div ref={wrapperRef} className="w-full">
      <div
        className="relative mx-auto bg-white shadow-sm"
        style={{ width: size.width || undefined, height: size.height || undefined }}
        data-page-number={pageNumber}
        data-scale={size.scale}
      >
        {/* Layer 1: PDF render */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0" />
        {/* Layer 2: highlight rectangles (populated in Sprint 2.3) */}
        <svg
          id="highlight-layer"
          className="pointer-events-none absolute inset-0 z-10"
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
        />
        {/* Layer 3: transparent selectable text */}
        <div ref={textLayerRef} className="textLayer !z-20" />
      </div>
    </div>
  );
}
