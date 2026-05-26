import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAnnotationStore } from "../../store/annotationStore";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { Highlight, HighlightColor } from "../../types/annotation";

interface HighlightPopoverProps {
  highlight: Highlight;
  docId: string;
  /** Viewport rect of the clicked highlight, used to anchor the popover. */
  anchor: DOMRect;
  onClose: () => void;
}

const COLORS: HighlightColor[] = ["yellow", "green", "pink", "blue"];
const POPOVER_WIDTH = 300;

export default function HighlightPopover({ highlight, docId, anchor, onClose }: HighlightPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const updateNote = useAnnotationStore((s) => s.updateHighlightNote);
  const updateColor = useAnnotationStore((s) => s.updateHighlightColor);
  const removeHighlight = useAnnotationStore((s) => s.removeHighlight);

  // Read the live highlight so color changes reflect immediately.
  const live = useAnnotationStore((s) =>
    (s.highlights[docId] ?? []).find((h) => h.id === highlight.id),
  );
  const currentColor = live?.color ?? highlight.color;

  const [note, setNote] = useState(highlight.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pos, setPos] = useState({ left: anchor.left, top: anchor.bottom + 8 });

  useLayoutEffect(() => {
    const el = ref.current;
    const height = el?.offsetHeight ?? 200;
    const margin = 8;
    let left = anchor.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - POPOVER_WIDTH - margin));
    let top = anchor.bottom + margin;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, anchor.top - height - margin);
    }
    setPos({ left, top });
  }, [anchor]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 rounded-xl border border-ink-4 bg-ink-2 p-3.5 shadow-2xl"
      style={{ left: pos.left, top: pos.top, width: POPOVER_WIDTH }}
    >
      <blockquote className="mb-3 max-h-28 overflow-auto border-l-2 border-ink-4 pl-2.5 font-serif text-[12px] italic leading-relaxed text-ghost">
        {highlight.selectedText}
      </blockquote>

      <textarea
        className="w-full resize-none rounded-md border border-ink-4 bg-ink-3 p-2 text-sm text-paper placeholder:text-ink-5 focus:border-ink-5 focus:outline-none"
        rows={3}
        maxLength={500}
        placeholder="Add a note…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => updateNote(docId, highlight.id, note)}
      />
      <div className="mb-3 mt-0.5 text-right font-mono text-[10px] text-ink-5">{note.length}/500</div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
                currentColor === color ? "ring-2 ring-paper ring-offset-2 ring-offset-ink-2" : ""
              }`}
              style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
              aria-label={`Change to ${color}`}
              onClick={() => updateColor(docId, highlight.id, color)}
            />
          ))}
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-dim">Delete?</span>
            <button
              className="font-medium text-red-400 hover:underline"
              onClick={() => {
                removeHighlight(docId, highlight.id);
                onClose();
              }}
            >
              Yes
            </button>
            <button className="text-dim hover:underline" onClick={() => setConfirmDelete(false)}>
              No
            </button>
          </div>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded p-1 text-sm text-dim hover:bg-ink-3 hover:text-red-400"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete highlight"
            title="Delete highlight"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
