import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

interface PageCanvasProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  /** Zoom multiplier applied on top of the fit-to-width scale. Default 1. */
  zoom?: number;
  /** Reports the rendered CSS pixel size of the page (after fit + zoom). */
  onRenderSize?: (size: { width: number; height: number; scale: number }) => void;
}

export interface PageCanvasHandle {
  canvas: HTMLCanvasElement | null;
}

/**
 * Renders a single PDF page onto a <canvas> at device-pixel-ratio quality.
 * Fits the page to its container width and re-renders on resize.
 */
const PageCanvas = forwardRef<PageCanvasHandle, PageCanvasProps>(function PageCanvas(
  { pdf, pageNumber, zoom = 1, onRenderSize },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useImperativeHandle(ref, () => ({ canvas: canvasRef.current }), []);

  // Track container width with a ResizeObserver.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Render the page whenever the document, page, width, or zoom changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    let renderTask: RenderTask | null = null;
    let cancelled = false;

    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;

      const base = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / base.width;
      const scale = fitScale * zoom;
      const viewport = page.getViewport({ scale });

      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Backing store at device resolution; CSS size at logical pixels.
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      onRenderSize?.({ width: viewport.width, height: viewport.height, scale });

      renderTask = page.render({
        canvas,
        canvasContext: ctx,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      renderTask.promise.catch((err: unknown) => {
        // RenderingCancelledException is expected on re-render; ignore it.
        if (err && typeof err === "object" && "name" in err && err.name === "RenderingCancelledException") return;
        console.error(`Failed to render page ${pageNumber}`, err);
      });
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, containerWidth, zoom, onRenderSize]);

  return (
    <div ref={containerRef} className="w-full" data-page-number={pageNumber}>
      <canvas
        ref={canvasRef}
        className="block mx-auto bg-white shadow-sm"
        aria-label={`Page ${pageNumber}`}
      />
    </div>
  );
});

export default PageCanvas;
