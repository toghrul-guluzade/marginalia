import { useMemo, useState } from "react";
import { Search, Plus, X, StickyNote as StickyNoteIcon } from "lucide-react";
import { useAnnotationStore } from "../../store/annotationStore";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { Highlight, StickyNote } from "../../types/annotation";
import type { LocalDoc } from "../../lib/localLibrary";

const EMPTY_H: Highlight[] = [];
const EMPTY_N: StickyNote[] = [];

export interface AnnotationRef {
  text: string;
  note?: string;
  sourceTitle: string;
  page: number;
}

interface PanelProps {
  /** The project's PDF documents (annotations live on these). */
  pdfDocs: LocalDoc[];
  isOpen: boolean;
  onClose: () => void;
  onInsert: (ref: AnnotationRef) => void;
}

interface Row extends AnnotationRef {
  id: string;
  kind: "highlight" | "note";
  color: string;
}

function truncate(t: string, n: number) {
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

export default function ProjectAnnotationsPanel({ pdfDocs, isOpen, onClose, onInsert }: PanelProps) {
  const highlightsMap = useAnnotationStore((s) => s.highlights);
  const stickyNotesMap = useAnnotationStore((s) => s.stickyNotes);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const doc of pdfDocs ?? []) {
      for (const h of highlightsMap[doc.id] ?? EMPTY_H) {
        out.push({
          id: h.id,
          kind: "highlight",
          color: HIGHLIGHT_COLORS[h.color],
          text: h.selectedText,
          note: h.note,
          sourceTitle: doc.title,
          page: h.rects[0]?.pageNumber ?? 0,
        });
      }
      for (const n of stickyNotesMap[doc.id] ?? EMPTY_N) {
        if (!n.content) continue;
        out.push({
          id: n.id,
          kind: "note",
          color: HIGHLIGHT_COLORS[n.color],
          text: n.content,
          sourceTitle: doc.title,
          page: n.pageNumber,
        });
      }
    }
    const q = query.trim().toLowerCase();
    return q
      ? out.filter((r) => `${r.text} ${r.note ?? ""} ${r.sourceTitle}`.toLowerCase().includes(q))
      : out;
  }, [pdfDocs, highlightsMap, stickyNotesMap, query]);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-l border-rule bg-ink-2 transition-all duration-200 ${
        isOpen ? "w-[300px]" : "w-0 opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <h2 className="flex-1 font-mono text-[11px] uppercase tracking-wider text-ghost">
          Project annotations
        </h2>
        <span className="rounded bg-ink-3 px-1.5 py-0.5 font-mono text-[10px] text-dim">{rows.length}</span>
        <button className="rounded p-1 text-dim hover:bg-ink-3 hover:text-paper" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <div className="border-b border-rule p-2.5">
        <div className="flex items-center gap-2 rounded-md border border-rule bg-ink-3 px-2">
          <Search size={14} className="text-dim" />
          <input
            className="w-full bg-transparent py-1.5 text-sm text-paper placeholder:text-ink-5 focus:outline-none"
            placeholder="Search annotations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {rows.length === 0 ? (
          <p className="mt-6 px-3 text-center font-mono text-xs text-dim">
            No annotations in this project's PDFs yet. Highlight text in a PDF to see it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <li
                key={r.id}
                className="group rounded-md border border-rule bg-ink-3 p-2.5 hover:border-ink-5"
              >
                <div className="flex items-start gap-2">
                  {r.kind === "note" ? (
                    <StickyNoteIcon size={13} className="mt-0.5 shrink-0" style={{ color: r.color }} />
                  ) : (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                  )}
                  <span className="min-w-0 flex-1 font-serif text-[12px] italic leading-snug text-ghost">
                    {truncate(r.text, 140)}
                  </span>
                  <button
                    className="shrink-0 rounded p-1 text-dim opacity-0 hover:bg-ink-4 hover:text-paper group-hover:opacity-100"
                    onClick={() => onInsert({ text: r.text, note: r.note, sourceTitle: r.sourceTitle, page: r.page })}
                    title="Insert into note with reference"
                    aria-label="Insert into note"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {r.note && (
                  <p className="mt-1.5 border-t border-rule pt-1.5 text-[11px] text-dim">{truncate(r.note, 90)}</p>
                )}
                <p className="mt-1.5 truncate font-mono text-[10px] text-ink-5">
                  {r.sourceTitle} · p.{r.page}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
