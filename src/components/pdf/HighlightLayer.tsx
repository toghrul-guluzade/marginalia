import { useAnnotationStore } from "../../store/annotationStore";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { Highlight } from "../../types/annotation";

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
 * text selection still works everywhere else on the page.
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
  const highlights = useAnnotationStore((s) => s.highlights[docId] ?? []);

  const onPage = highlights.filter((h) => h.rects.some((r) => r.pageNumber === pageNumber));

  return (
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
          onClick={(e) => {
            const target = e.currentTarget.getBoundingClientRect();
            onHighlightClick(h, target);
          }}
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
  );
}
