import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import PDFViewer, { type PDFViewerHandle } from "../components/pdf/PDFViewer";
import PDFToolbar from "../components/pdf/PDFToolbar";

// Hardcoded test PDF for Sprint 1. Replaced by Supabase-backed docs in Sprint 4.
const TEST_PDF_URL =
  "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf";
const TEST_TITLE = "Trace-based Just-in-Time Type Specialization";

export default function ViewerPage() {
  const { docId = "test" } = useParams();
  const viewerRef = useRef<PDFViewerHandle>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // zoom === 1 means fit-to-width; presets scale relative to that.
  const [zoom, setZoom] = useState(1);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, page), totalPages || 1);
      viewerRef.current?.scrollToPage(clamped);
    },
    [totalPages],
  );

  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);

  // Keyboard page navigation (ignore while typing in inputs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextPage();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevPage, nextPage]);

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center px-4 py-3">
          <h1 className="truncate text-base font-medium text-gray-800">{TEST_TITLE}</h1>
        </div>
        {/* Sticky toolbar */}
        <PDFToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onZoomChange={setZoom}
          onFitWidth={() => setZoom(1)}
        />
      </header>
      <main className="min-h-0 flex-1">
        <PDFViewer
          ref={viewerRef}
          url={TEST_PDF_URL}
          docId={docId}
          zoom={zoom}
          onTotalPages={setTotalPages}
          onCurrentPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
}
