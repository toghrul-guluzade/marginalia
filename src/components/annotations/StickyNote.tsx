import { useRef, useState } from "react";
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
 * A sticky note shown as a colored pin at a normalized page position.
 * - Hover the pin → a popup previews the note text.
 * - Click the pin → toggle the card open/closed (stays open until clicked again).
 * - Click the text inside the card → edit it; saves on blur.
 * - Drag the pin → reposition it.
 */
export default function StickyNote({ note, docId, pageWidth, pageHeight }: StickyNoteProps) {
  const updateStickyNote = useAnnotationStore((s) => s.updateStickyNote);
  const removeStickyNote = useAnnotationStore((s) => s.removeStickyNote);

  const [open, setOpen] = useState(!note.content); // brand-new notes open straight away
  const [editing, setEditing] = useState(!note.content);
  const [content, setContent] = useState(note.content);
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);

  const left = dragPos ? dragPos.left : note.x * pageWidth;
  const top = dragPos ? dragPos.top : note.y * pageHeight;

  function commit() {
    updateStickyNote(docId, note.id, { content });
  }

  // Drag the pin to reposition. The page container is the pin's offsetParent.
  function startDrag(e: React.PointerEvent) {
    e.stopPropagation();
    const container = wrapperRef.current?.offsetParent as HTMLElement | null;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    movedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const clamp = (v: number, max: number) => Math.min(Math.max(0, v), max);

    function move(ev: PointerEvent) {
      if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) movedRef.current = true;
      setDragPos({ left: clamp(ev.clientX - rect.left, rect.width), top: clamp(ev.clientY - rect.top, rect.height) });
    }
    function up(ev: PointerEvent) {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (movedRef.current) {
        updateStickyNote(docId, note.id, {
          x: clamp(ev.clientX - rect.left, rect.width) / rect.width,
          y: clamp(ev.clientY - rect.top, rect.height) / rect.height,
        });
      }
      setDragPos(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div ref={wrapperRef} className="pointer-events-auto absolute z-40" style={{ left, top }}>
      <button
        className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-black/10 shadow active:cursor-grabbing"
        style={{ backgroundColor: HIGHLIGHT_COLORS[note.color] }}
        onPointerDown={startDrag}
        onClick={(e) => {
          e.stopPropagation();
          if (movedRef.current) return; // it was a drag, not a click
          if (open) {
            commit();
            setOpen(false);
          } else {
            setEditing(!content); // read mode when there's already content
            setOpen(true);
          }
        }}
        aria-label="Sticky note"
      >
        <StickyNoteIcon size={13} className="text-black/60" />
      </button>

      {/* Card — stays open until the pin is clicked again */}
      {open && !dragPos && (
        <div
          className="absolute left-2 top-2 w-56 rounded-lg border border-ink-4 bg-ink-2 p-2 shadow-2xl"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {editing ? (
            <textarea
              autoFocus
              className="w-full resize-none rounded border border-ink-4 bg-ink-3 p-1.5 text-sm text-paper placeholder:text-ink-5 focus:border-ink-5 focus:outline-none"
              rows={3}
              placeholder="Write a note…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => {
                commit();
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  commit();
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div
              className="min-h-[2.5rem] cursor-text whitespace-pre-wrap rounded p-1.5 text-sm text-paper hover:bg-ink-3"
              title="Click to edit"
              onClick={() => setEditing(true)}
            >
              {content || <span className="text-ink-5">Click to add a note…</span>}
            </div>
          )}
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
