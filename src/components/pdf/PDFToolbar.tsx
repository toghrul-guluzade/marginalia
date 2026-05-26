import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  StickyNote,
} from "lucide-react";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { HighlightColor } from "../../types/annotation";

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const COLORS: HighlightColor[] = ["yellow", "green", "pink", "blue"];

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  noteMode: boolean;
  noteColor: HighlightColor;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  onToggleNoteMode: () => void;
  onNoteColorChange: (color: HighlightColor) => void;
}

function iconButton(disabled = false) {
  return `inline-flex items-center justify-center rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent ${disabled ? "" : ""}`;
}

export default function PDFToolbar({
  currentPage,
  totalPages,
  zoom,
  noteMode,
  noteColor,
  onPrevPage,
  onNextPage,
  onZoomChange,
  onFitWidth,
  onToggleNoteMode,
  onNoteColorChange,
}: PDFToolbarProps) {
  const [customZoom, setCustomZoom] = useState("");

  const pctValue = customZoom === "" ? Math.round(zoom * 100).toString() : customZoom;

  function commitCustomZoom() {
    const pct = Number(customZoom);
    if (!Number.isNaN(pct) && pct >= 10 && pct <= 500) {
      onZoomChange(pct / 100);
    }
    setCustomZoom("");
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button
          className={iconButton()}
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          title="Previous page (←)"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-gray-700">
          Page {currentPage} / {totalPages || "—"}
        </span>
        <button
          className={iconButton()}
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          title="Next page (→)"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          className={iconButton()}
          onClick={() => onZoomChange(Math.max(0.1, +(zoom - 0.25).toFixed(2)))}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>

        <select
          className="rounded border border-gray-200 bg-white px-1.5 py-1 text-sm text-gray-700"
          value={ZOOM_PRESETS.includes(zoom) ? zoom : ""}
          onChange={(e) => e.target.value && onZoomChange(Number(e.target.value))}
          aria-label="Zoom preset"
        >
          {!ZOOM_PRESETS.includes(zoom) && (
            <option value="">{Math.round(zoom * 100)}%</option>
          )}
          {ZOOM_PRESETS.map((z) => (
            <option key={z} value={z}>
              {Math.round(z * 100)}%
            </option>
          ))}
        </select>

        <input
          type="number"
          className="w-16 rounded border border-gray-200 px-1.5 py-1 text-sm text-gray-700"
          value={pctValue}
          min={10}
          max={500}
          aria-label="Custom zoom percentage"
          onChange={(e) => setCustomZoom(e.target.value)}
          onBlur={commitCustomZoom}
          onKeyDown={(e) => e.key === "Enter" && commitCustomZoom()}
        />
        <span className="text-sm text-gray-400">%</span>

        <button
          className={iconButton()}
          onClick={() => onZoomChange(+(zoom + 0.25).toFixed(2))}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>

        <button
          className={iconButton()}
          onClick={onFitWidth}
          aria-label="Fit to width"
          title="Fit to width"
        >
          <MoveHorizontal size={18} />
        </button>
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Note mode */}
      <div className="flex items-center gap-2">
        <button
          className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm ${
            noteMode
              ? "bg-brand text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={onToggleNoteMode}
          aria-pressed={noteMode}
          title="Note mode (N)"
        >
          <StickyNote size={16} />
          {noteMode ? "Note mode" : "Note"}
        </button>

        {noteMode && (
          <div className="flex items-center gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                  noteColor === color ? "ring-2 ring-gray-400 ring-offset-1" : "border-black/10"
                }`}
                style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
                aria-label={`Note color ${color}`}
                onClick={() => onNoteColorChange(color)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
