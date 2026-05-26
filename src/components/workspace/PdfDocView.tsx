import { useCallback, useEffect, useRef, useState } from "react";
import PDFViewer, { type PDFViewerHandle, type PageBg } from "../pdf/PDFViewer";
import PDFToolbar from "../pdf/PDFToolbar";
import AnnotationSidebar from "../annotations/AnnotationSidebar";
import ShortcutsModal from "../ui/ShortcutsModal";
import { useDocumentState } from "../../hooks/useDocumentState";
import { getFileUrl, updateDocument, type LocalDoc } from "../../lib/localLibrary";
import type { HighlightColor } from "../../types/annotation";

interface PdfDocViewProps {
  doc: LocalDoc;
  onRename: (title: string) => void;
}

/** PDF document workspace: toolbar + PDF.js viewer + annotation sidebar.
 *  Keyed by doc id upstream, so its state resets cleanly when switching docs. */
export default function PdfDocView({ doc, onRename }: PdfDocViewProps) {
  const docId = doc.id;
  const { restore, save } = useDocumentState(docId);
  const viewerRef = useRef<PDFViewerHandle>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(() => restore()?.zoom ?? 1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pulsingId, setPulsingId] = useState<string | null>(null);
  const [pageBg, setPageBg] = useState<PageBg>("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [noteColor, setNoteColor] = useState<HighlightColor>("yellow");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    getFileUrl(docId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPdfUrl(url);
        updateDocument(docId, { last_opened_at: new Date().toISOString() }).catch(() => {});
      })
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : "Failed to load"));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId]);

  const goToPage = useCallback(
    (page: number) => viewerRef.current?.scrollToPage(Math.min(Math.max(1, page), totalPages || 1)),
    [totalPages],
  );
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const pulseHighlight = useCallback((id: string) => {
    setPulsingId(id);
    window.setTimeout(() => setPulsingId(null), 1400);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
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
      } else if (e.key.toLowerCase() === "s") {
        setSidebarOpen((v) => !v);
      } else if (e.key.toLowerCase() === "n") {
        setNoteMode((v) => !v);
      } else if (e.key === "?") {
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevPage, nextPage]);

  useEffect(() => {
    const container = viewerRef.current?.getContainer();
    if (!container) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => save({ scrollY: container.scrollTop, zoom, page: currentPage }));
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
    <div className="flex min-w-0 flex-1 flex-col">
      <PDFToolbar
        title={doc.title}
        onRenameTitle={onRename}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        pageBg={pageBg}
        sidebarOpen={sidebarOpen}
        noteMode={noteMode}
        noteColor={noteColor}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        onZoomChange={setZoom}
        onFitWidth={() => setZoom(1)}
        onPageBgChange={setPageBg}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleNoteMode={() => setNoteMode((v) => !v)}
        onNoteColorChange={setNoteColor}
      />

      <div className="flex min-h-0 flex-1">
        <main className="min-h-0 min-w-0 flex-1">
          {loadError ? (
            <div className="flex h-full items-center justify-center bg-ink text-dim">{loadError}</div>
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
            <div className="flex h-full items-center justify-center bg-ink text-dim">Loading document…</div>
          )}
        </main>

        <AnnotationSidebar
          docId={docId}
          docTitle={doc.title}
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
