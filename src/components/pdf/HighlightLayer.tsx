import { useState } from "react";
import { useAnnotationStore } from "../../store/annotationStore";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { Highlight } from "../../types/annotation";

// Stable reference so the selector doesn't return a fresh array each render.
const EMPTY: Highlight[] = [];

interface HighlightLayerProps {
  docId: string;
  pageNumber: number;
  /** Current render scale; stored rects are scale-1.0 and multiplied by this. */
  scale: number;
  width: number;
  height: number;
  onHighlightClick: (highlight: Highlight, rect: DOMRect) => void;
  /** Id of a highlight to briefly pulse (e.g. after sidebar navigation). */
  pulsingId?: string | null;
}

/**
 * Layer 2: renders saved highlights for one page as SVG rectangles.
 * The <svg> ignores pointer events; only the highlight groups capture them so
 * text selection still works everywhere else on the page. Hovering a highlight
 * that has a note shows the note in a small popup.
 */
export default function HighlightLayer({
  docId,
  pageNumber,
  scale,
  width,
  height,
  onHighlightClick,
  pulsingId,
}: HighlightLayerProps) {
  const highlights = useAnnotationStore((s) => s.highlights[docId] ?? EMPTY);
  const [hover, setHover] = useState<{ note: string; left: number; top: number } | null>(null);

  const onPage = highlights.filter((h) => h.rects.some((r) => r.pageNumber === pageNumber));

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 z-30"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {onPage.map((h) => (
          <g
            key={h.id}
            className={`hl-group pointer-events-auto cursor-pointer ${pulsingId === h.id ? "pulsing" : ""}`}
            onClick={(e) => onHighlightClick(h, e.currentTarget.getBoundingClientRect())}
            onMouseEnter={(e) => {
              if (!h.note) return;
              const r = e.currentTarget.getBoundingClientRect();
              setHover({ note: h.note, left: r.left + r.width / 2, top: r.top });
            }}
            onMouseLeave={() => setHover(null)}
          >
            {h.rects
              .filter((r) => r.pageNumber === pageNumber)
              .map((r, i) => (
                <rect
                  key={i}
                  x={r.x * scale}
                  y={r.y * scale}
                  width={r.width * scale}
                  height={r.height * scale}
                  fill={HIGHLIGHT_COLORS[h.color]}
                  rx={2}
                />
              ))}
          </g>
        ))}
      </svg>

      {hover && (
        <div
          className="pointer-events-none fixed z-40 max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-ink-4 bg-ink-2 px-2.5 py-1.5 text-xs leading-snug text-ghost shadow-xl"
          style={{ left: hover.left, top: hover.top - 8 }}
        >
          {hover.note}
        </div>
      )}
    </>
  );
}
