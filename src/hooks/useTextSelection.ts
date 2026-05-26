import { useCallback, useEffect, useState } from "react";
import type { HighlightRect } from "../types/annotation";

export interface SelectionResult {
  selectedText: string;
  rects: HighlightRect[];
  pageNumber: number;
  /** Viewport coordinates for anchoring the tooltip (above selection midpoint). */
  anchor: { x: number; y: number };
}

/** Walk up from a node to the enclosing [data-page-number] page element. */
function findPageElement(node: Node | null): HTMLElement | null {
  let el = node instanceof HTMLElement ? node : node?.parentElement ?? null;
  while (el && !el.dataset.pageNumber) el = el.parentElement;
  return el;
}

/**
 * Tracks text selection within the PDF viewer and converts it to highlight
 * rectangles in scale-1.0 viewport coordinates (page-relative, top-left origin).
 *
 * Conversion: each Range client rect is viewport-space CSS px at the current
 * render scale. Subtract the page's top-left offset and divide by the page's
 * scale to get coordinates we can re-multiply by any future zoom.
 */
export function useTextSelection(): {
  selection: SelectionResult | null;
  clear: () => void;
} {
  const [selection, setSelection] = useState<SelectionResult | null>(null);

  const clear = useCallback(() => setSelection(null), []);

  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const selectedText = sel.toString().trim();
      if (!selectedText) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const pageEl = findPageElement(range.startContainer);
      if (!pageEl) {
        setSelection(null);
        return;
      }

      const pageRect = pageEl.getBoundingClientRect();
      const scale = Number(pageEl.dataset.scale) || 1;
      const pageNumber = Number(pageEl.dataset.pageNumber);

      const rects: HighlightRect[] = [];
      for (const r of Array.from(range.getClientRects())) {
        if (r.width < 1 || r.height < 1) continue;
        rects.push({
          x: (r.left - pageRect.left) / scale,
          y: (r.top - pageRect.top) / scale,
          width: r.width / scale,
          height: r.height / scale,
          pageNumber,
        });
      }
      if (rects.length === 0) {
        setSelection(null);
        return;
      }

      const bounds = range.getBoundingClientRect();
      setSelection({
        selectedText,
        rects,
        pageNumber,
        anchor: { x: bounds.left + bounds.width / 2, y: bounds.top },
      });
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return { selection, clear };
}
