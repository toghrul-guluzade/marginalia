import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  StickyNote,
  Settings,
  Highlighter,
  PanelRight,
} from "lucide-react";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { HighlightColor } from "../../types/annotation";
import type { PageBg } from "./PDFViewer";

const PAGE_BG_OPTIONS: Array<{ value: PageBg; label: string }> = [
  { value: "white", label: "White" },
  { value: "cream", label: "Cream" },
  { value: "dark", label: "Dark" },
];

const iconBtn =
  "inline-flex items-center justify-center rounded-md p-1.5 text-dim hover:bg-ink-3 hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent transition-colors";

function ReadingPrefs({ pageBg, onPageBgChange }: { pageBg: PageBg; onPageBgChange: (b: PageBg) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button className={iconBtn} onClick={() => setOpen((v) => !v)} aria-label="Reading preferences" title="Reading preferences">
        <Settings size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-ink-4 bg-ink-2 p-2 text-sm shadow-xl">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-dim">Page background</p>
          <div className="flex gap-1">
            {PAGE_BG_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`flex-1 rounded px-1.5 py-1 text-xs ${
                  pageBg === o.value ? "bg-ink-4 text-paper" : "text-dim hover:bg-ink-3"
                }`}
                onClick={() => onPageBgChange(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const COLORS: HighlightColor[] = ["yellow", "green", "pink", "blue"];

interface PDFToolbarProps {
  title: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  noteMode: boolean;
  noteColor: HighlightColor;
  highlightMode: boolean;
  pageBg: PageBg;
  sidebarOpen: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  onToggleNoteMode: () => void;
  onToggleHighlightMode: () => void;
  onNoteColorChange: (color: HighlightColor) => void;
  onPageBgChange: (b: PageBg) => void;
  onToggleSidebar: () => void;
}

export default function PDFToolbar({
  title,
  currentPage,
  totalPages,
  zoom,
  noteMode,
  noteColor,
  highlightMode,
  pageBg,
  sidebarOpen,
  onPrevPage,
  onNextPage,
  onZoomChange,
  onFitWidth,
  onToggleNoteMode,
  onToggleHighlightMode,
  onNoteColorChange,
  onPageBgChange,
  onToggleSidebar,
}: PDFToolbarProps) {
  const [customZoom, setCustomZoom] = useState("");
  const pctValue = customZoom === "" ? Math.round(zoom * 100).toString() : customZoom;

  function commitCustomZoom() {
    const pct = Number(customZoom);
    if (!Number.isNaN(pct) && pct >= 10 && pct <= 500) onZoomChange(pct / 100);
    setCustomZoom("");
  }

  return (
    <div className="flex items-center gap-2 border-b border-rule bg-ink-2 px-3 py-1.5">
      {/* Modes */}
      <button
        className={`${iconBtn} ${highlightMode ? "bg-ink-4 text-paper" : ""}`}
        onClick={onToggleHighlightMode}
        aria-pressed={highlightMode}
        title="Highlight mode (H)"
      >
        <Highlighter size={16} />
      </button>
      <button
        className={`${iconBtn} ${noteMode ? "bg-ink-4 text-paper" : ""}`}
        onClick={onToggleNoteMode}
        aria-pressed={noteMode}
        title="Note mode (N)"
      >
        <StickyNote size={16} />
      </button>

      <div className="mx-1 h-4 w-px bg-rule" />

      {/* Note color swatches */}
      {COLORS.map((color) => (
        <button
          key={color}
          className={`h-4 w-4 rounded-full border-2 transition-transform hover:scale-110 ${
            noteColor === color ? "border-paper" : "border-transparent"
          }`}
          style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
          aria-label={`Note color ${color}`}
          onClick={() => onNoteColorChange(color)}
        />
      ))}

      <div className="mx-1 h-4 w-px bg-rule" />

      {/* Active mode badge */}
      <span
        className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] tracking-wide ${
          highlightMode
            ? "bg-amber-500/15 text-amber-500"
            : noteMode
              ? "bg-ink-3 text-ghost"
              : "bg-ink-3 text-dim"
        }`}
      >
        {highlightMode ? "highlight" : noteMode ? "note" : "select"}
      </span>

      {/* Title */}
      <span className="mx-2 flex-1 truncate text-center font-serif text-sm italic text-paper" title={title}>
        {title}
      </span>

      {/* Page nav */}
      <button className={iconBtn} onClick={onPrevPage} disabled={currentPage <= 1} aria-label="Previous page" title="Previous page (←)">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[4.5rem] text-center font-mono text-[11px] text-dim">
        {currentPage} / {totalPages || "—"}
      </span>
      <button className={iconBtn} onClick={onNextPage} disabled={currentPage >= totalPages} aria-label="Next page" title="Next page (→)">
        <ChevronRight size={16} />
      </button>

      <div className="mx-1 h-4 w-px bg-rule" />

      {/* Zoom */}
      <button className={iconBtn} onClick={() => onZoomChange(Math.max(0.1, +(zoom - 0.25).toFixed(2)))} aria-label="Zoom out" title="Zoom out">
        <ZoomOut size={16} />
      </button>
      <input
        type="number"
        className="w-12 rounded border border-rule bg-ink-3 px-1 py-0.5 text-center font-mono text-[11px] text-paper focus:border-ink-5 focus:outline-none"
        value={pctValue}
        min={10}
        max={500}
        aria-label="Zoom percentage"
        onChange={(e) => setCustomZoom(e.target.value)}
        onBlur={commitCustomZoom}
        onKeyDown={(e) => e.key === "Enter" && commitCustomZoom()}
      />
      <button className={iconBtn} onClick={() => onZoomChange(+(zoom + 0.25).toFixed(2))} aria-label="Zoom in" title="Zoom in">
        <ZoomIn size={16} />
      </button>
      <button className={iconBtn} onClick={onFitWidth} aria-label="Fit to width" title="Fit to width">
        <MoveHorizontal size={16} />
      </button>

      <div className="mx-1 h-4 w-px bg-rule" />

      <ReadingPrefs pageBg={pageBg} onPageBgChange={onPageBgChange} />
      <button
        className={`${iconBtn} ${sidebarOpen ? "bg-ink-4 text-paper" : ""}`}
        onClick={onToggleSidebar}
        aria-label="Toggle annotations"
        title="Toggle annotations (S)"
      >
        <PanelRight size={16} />
      </button>
    </div>
  );
}
