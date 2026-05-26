import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { usePDFDocument } from "../../hooks/usePDFDocument";
import { usePageObserver } from "../../hooks/usePageObserver";
import { useTextSelection } from "../../hooks/useTextSelection";
import { useAnnotationStore } from "../../store/annotationStore";
import type { Highlight, HighlightColor } from "../../types/annotation";
import PDFPage from "./PDFPage";
import HighlightTooltip from "./HighlightTooltip";
import HighlightPopover from "../annotations/HighlightPopover";
import QuickNoteEditor from "../annotations/QuickNoteEditor";
import DocumentSearchBar from "./DocumentSearchBar";

export type PageBg = "white" | "cream" | "dark";

const PAGE_BG: Record<PageBg, string> = {
  white: "bg-gray-200",
  cream: "bg-[#FAFAF7]",
  dark: "bg-ink",
};

interface PDFViewerProps {
  /** A blob URL or remote URL to the PDF. */
  url: string;
  /** Document id used to key annotations. */
  docId: string;
  /** Zoom multiplier applied on top of fit-to-width. Default 1. */
  zoom?: number;
  /** When true, clicking a page places a sticky note. */
  noteMode?: boolean;
  noteColor?: HighlightColor;
  /** Id of a highlight to briefly pulse (sidebar navigation). */
  pulsingId?: string | null;
  /** Reading-area background. */
  pageBg?: PageBg;
  /** Whether the in-document search bar is open. */
  searchOpen?: boolean;
  onCloseSearch?: () => void;
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
    <div className="flex h-full flex-col items-center gap-4 overflow-hidden bg-ink py-8" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[1/1.3] w-full max-w-xl animate-pulse rounded bg-ink-3"
        />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-ink p-8 text-center">
      <p className="text-lg font-medium text-paper">Could not load this PDF</p>
      <p className="max-w-md text-sm text-dim">{error.message}</p>
    </div>
  );
}

/**
 * Renders a full PDF document as vertically stacked pages, fit to width at
 * device-pixel-ratio quality. Exposes scroll-to-page via a ref handle.
 */
const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(function PDFViewer(
  {
    url,
    docId,
    zoom = 1,
    noteMode = false,
    noteColor = "yellow",
    pulsingId,
    pageBg = "white",
    searchOpen = false,
    onCloseSearch,
    onTotalPages,
    onCurrentPageChange,
  },
  ref,
) {
  const { pdf, totalPages, isLoading, error } = usePDFDocument(url);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPage = usePageObserver(scrollRef, totalPages);
  const { selection, clear } = useTextSelection();
  const addHighlight = useAnnotationStore((s) => s.addHighlight);
  const updateHighlightNote = useAnnotationStore((s) => s.updateHighlightNote);
  const [activePopover, setActivePopover] = useState<{
    highlight: Highlight;
    anchor: DOMRect;
  } | null>(null);
  const [quickNote, setQuickNote] = useState<{ id: string; anchor: { x: number; y: number } } | null>(
    null,
  );

  function createHighlight(color: HighlightColor): Highlight | null {
    if (!selection) return null;
    const highlight: Highlight = {
      id: crypto.randomUUID(),
      docId,
      color,
      rects: selection.rects,
      selectedText: selection.selectedText,
      createdAt: new Date().toISOString(),
    };
    addHighlight(highlight);
    clear();
    window.getSelection()?.removeAllRanges();
    return highlight;
  }

  function handleQuickNote() {
    if (!selection) return;
    const anchor = selection.anchor;
    const highlight = createHighlight("yellow");
    if (highlight) setQuickNote({ id: highlight.id, anchor });
  }

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
    <div className="relative h-full">
      <div ref={scrollRef} className={`flex h-full justify-center overflow-auto py-4 ${PAGE_BG[pageBg]}`}>
        <div className="flex w-full max-w-3xl flex-col gap-4 px-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <PDFPage
              key={pageNumber}
              pdf={pdf}
              pageNumber={pageNumber}
              docId={docId}
              zoom={zoom}
              noteMode={noteMode}
              noteColor={noteColor}
              pulsingId={pulsingId}
              onHighlightClick={(highlight, anchor) => setActivePopover({ highlight, anchor })}
            />
          ))}
        </div>
      </div>

      {searchOpen && (
        <DocumentSearchBar scrollRootRef={scrollRef} onClose={() => onCloseSearch?.()} />
      )}
      {selection && (
        <HighlightTooltip
          anchor={selection.anchor}
          onHighlight={createHighlight}
          onQuickNote={handleQuickNote}
          onClose={clear}
        />
      )}
      {quickNote && (
        <QuickNoteEditor
          anchor={quickNote.anchor}
          onSave={(text) => {
            if (text) updateHighlightNote(docId, quickNote.id, text);
            setQuickNote(null);
          }}
          onCancel={() => setQuickNote(null)}
        />
      )}
      {activePopover && (
        <HighlightPopover
          highlight={activePopover.highlight}
          docId={docId}
          anchor={activePopover.anchor}
          onClose={() => setActivePopover(null)}
        />
      )}
    </div>
  );
});

export default PDFViewer;
