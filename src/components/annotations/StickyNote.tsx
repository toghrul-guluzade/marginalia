import { useEffect, useRef, useState } from "react";
import { StickyNote as StickyNoteIcon, Trash2 } from "lucide-react";
import { useAnnotationStore } from "../../store/annotationStore";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { StickyNote as StickyNoteType } from "../../types/annotation";

interface StickyNoteProps {
  note: StickyNoteType;
  docId: string;
  pageWidth: number;
  pageHeight: number;
}

/**
 * A sticky note shown as a colored pin at a normalized page position. Clicking
 * the pin expands a card with an auto-saving textarea. Position scales with zoom
 * because it is derived from normalized coords * current page dimensions.
 */
export default function StickyNote({ note, docId, pageWidth, pageHeight }: StickyNoteProps) {
  const updateStickyNote = useAnnotationStore((s) => s.updateStickyNote);
  const removeStickyNote = useAnnotationStore((s) => s.removeStickyNote);
  const [expanded, setExpanded] = useState(!note.content);
  const [content, setContent] = useState(note.content);
  const cardRef = useRef<HTMLDivElement>(null);

  const left = note.x * pageWidth;
  const top = note.y * pageHeight;

  useEffect(() => {
    if (!expanded) return;
    function onDown(e: PointerEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        updateStickyNote(docId, note.id, { content });
        setExpanded(false);
      }
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [expanded, content, docId, note.id, updateStickyNote]);

  return (
    <div className="pointer-events-auto absolute z-40" style={{ left, top }}>
      <button
        className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 shadow"
        style={{ backgroundColor: HIGHLIGHT_COLORS[note.color] }}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        aria-label="Sticky note"
        title={note.content || "Sticky note"}
      >
        <StickyNoteIcon size={13} className="text-black/60" />
      </button>

      {expanded && (
        <div
          ref={cardRef}
          className="absolute left-2 top-2 w-56 rounded-lg border border-ink-4 bg-ink-2 p-2 shadow-2xl"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            autoFocus
            className="w-full resize-none rounded border border-ink-4 bg-ink-3 p-1.5 text-sm text-paper placeholder:text-ink-5 focus:border-ink-5 focus:outline-none"
            rows={3}
            placeholder="Write a note…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => updateStickyNote(docId, note.id, { content })}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-dim">
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
            <button
              className="inline-flex items-center gap-1 rounded p-0.5 hover:bg-ink-3 hover:text-red-400"
              onClick={() => removeStickyNote(docId, note.id)}
              aria-label="Delete note"
              title="Delete note"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
