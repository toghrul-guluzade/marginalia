import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PanelRight } from "lucide-react";
import PDFViewer, { type PDFViewerHandle } from "../components/pdf/PDFViewer";
import PDFToolbar from "../components/pdf/PDFToolbar";
import AnnotationSidebar from "../components/annotations/AnnotationSidebar";
import type { HighlightColor } from "../types/annotation";

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
  const [noteMode, setNoteMode] = useState(false);
  const [noteColor, setNoteColor] = useState<HighlightColor>("yellow");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, page), totalPages || 1);
      viewerRef.current?.scrollToPage(clamped);
    },
    [totalPages],
  );

  const pulseHighlight = useCallback((id: string) => {
    setPulsingId(id);
    window.setTimeout(() => setPulsingId(null), 1400);
  }, []);

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
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevPage, nextPage]);

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <h1 className="min-w-0 flex-1 truncate text-base font-medium text-gray-800">{TEST_TITLE}</h1>
          <button
            className={`rounded p-1.5 ${sidebarOpen ? "bg-brand-light text-brand-dark" : "text-gray-500 hover:bg-gray-100"}`}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle annotation sidebar"
            title="Annotations (Ctrl/Cmd+Shift+A)"
          >
            <PanelRight size={18} />
          </button>
        </div>
        {/* Sticky toolbar */}
        <PDFToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          noteMode={noteMode}
          noteColor={noteColor}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onZoomChange={setZoom}
          onFitWidth={() => setZoom(1)}
          onToggleNoteMode={() => setNoteMode((v) => !v)}
          onNoteColorChange={setNoteColor}
        />
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 min-w-0 flex-1">
          <PDFViewer
            ref={viewerRef}
            url={TEST_PDF_URL}
            docId={docId}
            zoom={zoom}
            noteMode={noteMode}
            noteColor={noteColor}
            pulsingId={pulsingId}
            onTotalPages={setTotalPages}
            onCurrentPageChange={setCurrentPage}
          />
        </main>
        <AnnotationSidebar
          docId={docId}
          docTitle={TEST_TITLE}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectHighlight={(h) => {
            goToPage(h.rects[0]?.pageNumber ?? 1);
            pulseHighlight(h.id);
          }}
          onSelectNote={(n) => goToPage(n.pageNumber)}
        />
      </div>
    </div>
  );
}
