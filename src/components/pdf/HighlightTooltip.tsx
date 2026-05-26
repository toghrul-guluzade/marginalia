import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import type { HighlightColor } from "../../types/annotation";
import { HIGHLIGHT_COLORS } from "../../types/annotation";

interface HighlightTooltipProps {
  /** Viewport coordinates of the selection's top-center. */
  anchor: { x: number; y: number };
  onHighlight: (color: HighlightColor) => void;
  /** Quick-add: create a yellow highlight and immediately open a note editor. */
  onQuickNote: () => void;
  onClose: () => void;
}

const COLORS: HighlightColor[] = ["yellow", "green", "pink", "blue"];

/**
 * A small floating toolbar shown above a text selection with four color swatches.
 * Dismisses on outside click or Escape.
 */
export default function HighlightTooltip({ anchor, onHighlight, onQuickNote, onClose }: HighlightTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: anchor.x, top: anchor.y });

  // Position above the selection midpoint, clamped to the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let left = anchor.x - rect.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
    let top = anchor.y - rect.height - margin;
    if (top < margin) top = anchor.y + margin + 16; // flip below if no room above
    setPos({ left, top });
  }, [anchor]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey);
    // capture so it fires before a new selection's mouseup logic
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-1 rounded-lg border border-ink-4 bg-ink-2 p-1.5 shadow-xl"
      style={{ left: pos.left, top: pos.top }}
      // keep the text selection alive while interacting with the tooltip
      onPointerDown={(e) => e.preventDefault()}
    >
      {COLORS.map((color) => (
        <button
          key={color}
          className="h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110"
          style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
          aria-label={`Highlight ${color}`}
          title={`Highlight ${color}`}
          onClick={() => onHighlight(color)}
        />
      ))}
      <span className="mx-0.5 h-5 w-px bg-rule" />
      <button
        className="flex h-6 w-6 items-center justify-center rounded text-dim hover:bg-ink-3 hover:text-paper"
        aria-label="Highlight and add note"
        title="Highlight + note"
        onClick={onQuickNote}
      >
        <StickyNote size={16} />
      </button>
    </div>
  );
}
