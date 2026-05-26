import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { usePDFDocument } from "../../hooks/usePDFDocument";
import { usePageObserver } from "../../hooks/usePageObserver";
import PageCanvas from "./PageCanvas";

interface PDFViewerProps {
  /** A blob URL or remote URL to the PDF. */
  url: string;
  /** Zoom multiplier applied on top of fit-to-width. Default 1. */
  zoom?: number;
  /** Reports the total page count once the document loads. */
  onTotalPages?: (total: number) => void;
  /** Reports the most-visible page as the user scrolls. */
  onCurrentPageChange?: (page: number) => void;
}

export interface PDFViewerHandle {
  /** Smooth-scrolls the viewer so the given page is at the top. */
  scrollToPage: (pageNumber: number) => void;
  /** The scroll container, exposed for fit-to-width width calculations. */
  getContainer: () => HTMLDivElement | null;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-8" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full max-w-3xl aspect-[1/1.3] rounded bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg font-medium text-gray-800">Could not load this PDF</p>
      <p className="max-w-md text-sm text-gray-500">{error.message}</p>
    </div>
  );
}

/**
 * Renders a full PDF document as vertically stacked pages, fit to width at
 * device-pixel-ratio quality. Exposes scroll-to-page via a ref handle.
 */
const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(function PDFViewer(
  { url, zoom = 1, onTotalPages, onCurrentPageChange },
  ref,
) {
  const { pdf, totalPages, isLoading, error } = usePDFDocument(url);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPage = usePageObserver(scrollRef, totalPages);

  useImperativeHandle(ref, () => ({
    scrollToPage(pageNumber: number) {
      const root = scrollRef.current;
      if (!root) return;
      const el = root.querySelector<HTMLElement>(
        `[data-page-number="${pageNumber}"]`,
      );
      if (el) {
        root.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
      }
    },
    getContainer: () => scrollRef.current,
  }), []);

  useEffect(() => {
    if (totalPages > 0) onTotalPages?.(totalPages);
  }, [totalPages, onTotalPages]);

  useEffect(() => {
    onCurrentPageChange?.(currentPage);
  }, [currentPage, onCurrentPageChange]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!pdf) return null;

  return (
    <div ref={scrollRef} className="flex h-full justify-center overflow-auto bg-gray-100 py-4">
      <div className="flex w-full max-w-3xl flex-col gap-4 px-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <PageCanvas key={pageNumber} pdf={pdf} pageNumber={pageNumber} zoom={zoom} />
        ))}
      </div>
    </div>
  );
});

export default PDFViewer;
