import { useMemo, useState } from "react";
import { Search, Download, X, StickyNote as StickyNoteIcon, Trash2 } from "lucide-react";
import { useAnnotationStore } from "../../store/annotationStore";
import { HIGHLIGHT_COLORS } from "../../types/annotation";
import type { Highlight, HighlightColor, StickyNote } from "../../types/annotation";

const EMPTY_H: Highlight[] = [];
const EMPTY_N: StickyNote[] = [];

type FilterKind = "all" | "highlights" | "notes";

interface AnnotationSidebarProps {
  docId: string;
  docTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectHighlight: (h: Highlight) => void;
  onSelectNote: (n: StickyNote) => void;
}

type Item =
  | { type: "highlight"; data: Highlight; page: number }
  | { type: "note"; data: StickyNote; page: number };

function truncate(text: string, n: number) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

function highlightPage(h: Highlight): number {
  return h.rects[0]?.pageNumber ?? 0;
}

export function buildMarkdown(title: string, highlights: Highlight[], notes: StickyNote[]): string {
  const lines: string[] = [`# Annotations: ${title}`, ""];
  const pages = new Set<number>([...highlights.map(highlightPage), ...notes.map((n) => n.pageNumber)]);
  for (const page of [...pages].sort((a, b) => a - b)) {
    lines.push(`## Page ${page}`, "");
    for (const h of highlights.filter((h) => highlightPage(h) === page)) {
      lines.push(`### Highlight (${h.color})`, `> ${h.selectedText}`);
      if (h.note) lines.push(`Note: ${h.note}`);
      lines.push("---");
    }
    for (const n of notes.filter((n) => n.pageNumber === page)) {
      lines.push(`### Note (${n.color})`, n.content || "_empty_", "---");
    }
    lines.push("");
  }
  return lines.join("\n");
}

export default function AnnotationSidebar({
  docId,
  docTitle,
  isOpen,
  onClose,
  onSelectHighlight,
  onSelectNote,
}: AnnotationSidebarProps) {
  const highlights = useAnnotationStore((s) => s.highlights[docId] ?? EMPTY_H);
  const stickyNotes = useAnnotationStore((s) => s.stickyNotes[docId] ?? EMPTY_N);
  const removeHighlight = useAnnotationStore((s) => s.removeHighlight);
  const removeStickyNote = useAnnotationStore((s) => s.removeStickyNote);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<FilterKind>("all");
  const [colorFilter, setColorFilter] = useState<HighlightColor | null>(null);

  const total = highlights.length + stickyNotes.length;

  // Filtered items, grouped by page in document order (Adobe-style).
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: Item[] = [
      ...highlights.map((h) => ({ type: "highlight" as const, data: h, page: highlightPage(h) })),
      ...stickyNotes.map((n) => ({ type: "note" as const, data: n, page: n.pageNumber })),
    ].filter((item) => {
      if (kind === "highlights" && item.type !== "highlight") return false;
      if (kind === "notes" && item.type !== "note") return false;
      if (colorFilter && item.data.color !== colorFilter) return false;
      if (!q) return true;
      const text =
        item.type === "highlight"
          ? `${item.data.selectedText} ${item.data.note ?? ""}`
          : item.data.content;
      return text.toLowerCase().includes(q);
    });

    const byPage = new Map<number, Item[]>();
    for (const item of items) {
      const arr = byPage.get(item.page) ?? [];
      arr.push(item);
      byPage.set(item.page, arr);
    }
    return [...byPage.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([page, list]) => ({
        page,
        list: list.sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt)),
      }));
  }, [highlights, stickyNotes, query, kind, colorFilter]);

  const filteredCount = groups.reduce((n, g) => n + g.list.length, 0);

  function handleExport() {
    const md = buildMarkdown(docTitle, highlights, stickyNotes);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/[^\w.-]+/g, "_") || "annotations"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function deleteItem(item: Item) {
    if (item.type === "highlight") removeHighlight(docId, item.data.id);
    else removeStickyNote(docId, item.data.id);
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-l border-rule bg-ink-2 transition-all duration-200 ${
        isOpen ? "w-[300px]" : "w-0 opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <h2 className="flex-1 font-mono text-[11px] uppercase tracking-wider text-ghost">Annotations</h2>
        <span className="rounded bg-ink-3 px-1.5 py-0.5 font-mono text-[10px] text-dim">{total}</span>
        <button className="rounded p-1 text-dim hover:bg-ink-3 hover:text-paper" onClick={onClose} aria-label="Close sidebar">
          <X size={15} />
        </button>
      </div>

      {/* Search + filters */}
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
        <div className="mt-2 flex items-center gap-1 text-xs">
          {(["all", "highlights", "notes"] as FilterKind[]).map((k) => (
            <button
              key={k}
              className={`rounded px-2 py-1 font-mono text-[10.5px] capitalize ${
                kind === k ? "bg-ink-4 text-paper" : "bg-ink-3 text-dim hover:text-ghost"
              }`}
              onClick={() => setKind(k)}
            >
              {k}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((c) => (
              <button
                key={c}
                className={`h-3.5 w-3.5 rounded-full ${colorFilter === c ? "ring-2 ring-paper" : ""}`}
                style={{ backgroundColor: HIGHLIGHT_COLORS[c] }}
                onClick={() => setColorFilter(colorFilter === c ? null : c)}
                aria-label={`Filter ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Grouped list */}
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {filteredCount === 0 && (
          <p className="mt-6 text-center font-mono text-xs text-dim">
            {total === 0 ? "No annotations yet" : "No matches"}
          </p>
        )}
        {groups.map((group) => (
          <section key={group.page} className="mb-3">
            <h3 className="px-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-ink-5">
              Page {group.page}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {group.list.map((item) => (
                <li key={item.data.id} className="group/card">
                  <div className="flex items-stretch gap-0 overflow-hidden rounded-md border border-rule bg-ink-3 hover:border-ink-5">
                    <button
                      className="flex min-w-0 flex-1 items-start gap-2 p-2.5 text-left"
                      onClick={() =>
                        item.type === "highlight" ? onSelectHighlight(item.data) : onSelectNote(item.data)
                      }
                    >
                      {item.type === "note" ? (
                        <StickyNoteIcon size={13} className="mt-0.5 shrink-0" style={{ color: HIGHLIGHT_COLORS[item.data.color] }} />
                      ) : (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLORS[item.data.color] }} />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[12px] italic leading-snug text-ghost">
                          {item.type === "highlight"
                            ? truncate(item.data.selectedText, 120)
                            : item.data.content
                              ? truncate(item.data.content, 110)
                              : "Empty note"}
                        </span>
                        {item.type === "highlight" && item.data.note && (
                          <span className="mt-1.5 block border-t border-rule pt-1.5 text-[11px] text-dim">
                            {truncate(item.data.note, 90)}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      className="flex w-8 shrink-0 items-center justify-center text-ink-5 opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover/card:opacity-100"
                      onClick={() => deleteItem(item)}
                      aria-label="Delete annotation"
                      title="Delete annotation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Export */}
      <div className="border-t border-rule p-2.5">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md border border-ink-4 py-2 font-mono text-[11.5px] tracking-wide text-dim hover:border-ink-5 hover:bg-ink-3 hover:text-ghost disabled:opacity-40"
          onClick={handleExport}
          disabled={total === 0}
        >
          <Download size={13} />
          Export as Markdown
        </button>
      </div>
    </aside>
  );
}
