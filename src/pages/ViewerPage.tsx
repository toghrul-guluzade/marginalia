import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PanelRight, ArrowLeft } from "lucide-react";
import PDFViewer, { type PDFViewerHandle, type PageBg } from "../components/pdf/PDFViewer";
import PDFToolbar from "../components/pdf/PDFToolbar";
import AnnotationSidebar from "../components/annotations/AnnotationSidebar";
import ShortcutsModal from "../components/ui/ShortcutsModal";
import { useDocumentAnnotations } from "../hooks/useDocumentAnnotations";
import { useDocumentState } from "../hooks/useDocumentState";
import {
  getDocument,
  getSignedUrl,
  updateDocument,
  isSupabaseConfigured,
} from "../lib/supabase";
import type { HighlightColor } from "../types/annotation";

// Fallback demo PDF (docId "test", or whenever Supabase is unconfigured).
const TEST_PDF_URL =
  "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf";
const TEST_TITLE = "Trace-based Just-in-Time Type Specialization";

export default function ViewerPage() {
  const { docId = "test" } = useParams();
  useDocumentAnnotations(docId);
  const { restore, save } = useDocumentState(docId);
  const viewerRef = useRef<PDFViewerHandle>(null);

  const isDemo = !isSupabaseConfigured || docId === "test";
  const [pdfUrl, setPdfUrl] = useState<string | null>(isDemo ? TEST_PDF_URL : null);
  const [title, setTitle] = useState(isDemo ? TEST_TITLE : "Loading…");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load the real document (signed URL + title) and stamp last_opened_at.
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    getDocument(docId)
      .then(async (doc) => {
        if (!doc) throw new Error("Document not found");
        const url = await getSignedUrl(doc.storage_path);
        if (cancelled) return;
        setPdfUrl(url);
        setTitle(doc.title);
        updateDocument(docId, { last_opened_at: new Date().toISOString() }).catch(() => {});
      })
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [docId, isDemo]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // zoom === 1 means fit-to-width; presets scale relative to that.
  const [zoom, setZoom] = useState(() => restore()?.zoom ?? 1);
  const [noteMode, setNoteMode] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [noteColor, setNoteColor] = useState<HighlightColor>("yellow");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pulsingId, setPulsingId] = useState<string | null>(null);
  const [pageBg, setPageBg] = useState<PageBg>("white");
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

  // Keyboard shortcuts (ignore single-key shortcuts while typing in inputs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + F — find in document
      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setShortcutsOpen(false);
        return;
      }

      if (typing || mod) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextPage();
      } else if (e.key.toLowerCase() === "h") {
        setHighlightMode((v) => !v);
        setNoteMode(false);
      } else if (e.key.toLowerCase() === "n") {
        setNoteMode((v) => !v);
        setHighlightMode(false);
      } else if (e.key.toLowerCase() === "s") {
        setSidebarOpen((v) => !v);
      } else if (e.key === "?") {
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevPage, nextPage]);

  // Persist scroll/zoom/page per document, and restore scroll after load.
  useEffect(() => {
    const container = viewerRef.current?.getContainer();
    if (!container) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        save({ scrollY: container.scrollTop, zoom, page: currentPage }),
      );
    };
    container.addEventListener("scroll", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [save, zoom, currentPage, pdfUrl, totalPages]);

  useEffect(() => {
    if (totalPages === 0) return;
    const saved = restore();
    if (!saved) return;
    const t = window.setTimeout(() => {
      const container = viewerRef.current?.getContainer();
      if (container) container.scrollTop = saved.scrollY;
    }, 400);
    return () => window.clearTimeout(t);
  }, [totalPages, restore]);

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            to="/"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Back to library"
            title="Back to library"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-base font-medium text-gray-800">{title}</h1>
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
          highlightMode={highlightMode}
          pageBg={pageBg}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onZoomChange={setZoom}
          onFitWidth={() => setZoom(1)}
          onToggleNoteMode={() => { setNoteMode((v) => !v); setHighlightMode(false); }}
          onToggleHighlightMode={() => { setHighlightMode((v) => !v); setNoteMode(false); }}
          onNoteColorChange={setNoteColor}
          onPageBgChange={setPageBg}
        />
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 min-w-0 flex-1">
          {loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-gray-700">{loadError}</p>
              <Link to="/" className="text-sm font-medium text-brand hover:underline">
                Back to library
              </Link>
            </div>
          ) : pdfUrl ? (
            <PDFViewer
              ref={viewerRef}
              url={pdfUrl}
              docId={docId}
              zoom={zoom}
              noteMode={noteMode}
              noteColor={noteColor}
              pulsingId={pulsingId}
              pageBg={pageBg}
              searchOpen={searchOpen}
              onCloseSearch={() => setSearchOpen(false)}
              onTotalPages={setTotalPages}
              onCurrentPageChange={setCurrentPage}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Loading document…</div>
          )}
        </main>
        <AnnotationSidebar
          docId={docId}
          docTitle={title}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectHighlight={(h) => {
            goToPage(h.rects[0]?.pageNumber ?? 1);
            pulseHighlight(h.id);
          }}
          onSelectNote={(n) => goToPage(n.pageNumber)}
        />
      </div>

      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
