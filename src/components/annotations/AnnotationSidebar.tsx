import { useMemo, useState } from "react";
import { Search, Download, X, StickyNote as StickyNoteIcon } from "lucide-react";
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

function truncate(text: string, n: number) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

/** Page number of a highlight (from its first rect). */
function highlightPage(h: Highlight): number {
  return h.rects[0]?.pageNumber ?? 0;
}

export function buildMarkdown(
  title: string,
  highlights: Highlight[],
  notes: StickyNote[],
): string {
  const lines: string[] = [`# Annotations: ${title}`, ""];
  const pages = new Set<number>([
    ...highlights.map(highlightPage),
    ...notes.map((n) => n.pageNumber),
  ]);
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

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<FilterKind>("all");
  const [colorFilter, setColorFilter] = useState<HighlightColor | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const combined: Array<
      { type: "highlight"; data: Highlight } | { type: "note"; data: StickyNote }
    > = [
      ...highlights.map((h) => ({ type: "highlight" as const, data: h })),
      ...stickyNotes.map((n) => ({ type: "note" as const, data: n })),
    ];
    return combined
      .filter((item) => {
        if (kind === "highlights" && item.type !== "highlight") return false;
        if (kind === "notes" && item.type !== "note") return false;
        if (colorFilter && item.data.color !== colorFilter) return false;
        if (!q) return true;
        const text =
          item.type === "highlight"
            ? `${item.data.selectedText} ${item.data.note ?? ""}`
            : item.data.content;
        return text.toLowerCase().includes(q);
      })
      .sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
  }, [highlights, stickyNotes, query, kind, colorFilter]);

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

  return (
    <aside
      className={`flex h-full w-[280px] shrink-0 flex-col border-l border-gray-200 bg-white transition-all duration-200 ${
        isOpen ? "" : "mr-[-280px]"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-700">Annotations</h2>
        <button className="rounded p-1 text-gray-400 hover:bg-gray-100" onClick={onClose} aria-label="Close sidebar">
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-gray-100 p-2">
        <div className="flex items-center gap-2 rounded border border-gray-200 px-2">
          <Search size={14} className="text-gray-400" />
          <input
            className="w-full py-1.5 text-sm focus:outline-none"
            placeholder="Search annotations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter row */}
        <div className="mt-2 flex items-center gap-1 text-xs">
          {(["all", "highlights", "notes"] as FilterKind[]).map((k) => (
            <button
              key={k}
              className={`rounded px-2 py-1 capitalize ${
                kind === k ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
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
                className={`h-4 w-4 rounded-full border ${
                  colorFilter === c ? "ring-2 ring-gray-400" : "border-black/10"
                }`}
                style={{ backgroundColor: HIGHLIGHT_COLORS[c] }}
                onClick={() => setColorFilter(colorFilter === c ? null : c)}
                aria-label={`Filter ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {items.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-400">No annotations yet</p>
        )}
        <ul className="flex flex-col gap-2">
          {items.map((item) =>
            item.type === "highlight" ? (
              <li key={item.data.id}>
                <button
                  className="flex w-full gap-2 rounded border border-gray-200 p-2 text-left hover:bg-gray-50"
                  onClick={() => onSelectHighlight(item.data)}
                >
                  <span
                    className="w-1 shrink-0 rounded"
                    style={{ backgroundColor: HIGHLIGHT_COLORS[item.data.color] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-800">
                      {truncate(item.data.selectedText, 120)}
                    </span>
                    {item.data.note && (
                      <span className="mt-1 block text-xs italic text-gray-500">
                        {truncate(item.data.note, 80)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 self-start rounded bg-gray-100 px-1 text-xs text-gray-500">
                    p.{highlightPage(item.data)}
                  </span>
                </button>
              </li>
            ) : (
              <li key={item.data.id}>
                <button
                  className="flex w-full gap-2 rounded border border-gray-200 p-2 text-left hover:bg-gray-50"
                  onClick={() => onSelectNote(item.data)}
                >
                  <StickyNoteIcon
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: HIGHLIGHT_COLORS[item.data.color] }}
                  />
                  <span className="min-w-0 flex-1 text-sm text-gray-800">
                    {item.data.content ? truncate(item.data.content, 100) : (
                      <em className="text-gray-400">Empty note</em>
                    )}
                  </span>
                  <span className="shrink-0 self-start rounded bg-gray-100 px-1 text-xs text-gray-500">
                    p.{item.data.pageNumber}
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>
      </div>

      {/* Export */}
      <div className="border-t border-gray-200 p-2">
        <button
          className="flex w-full items-center justify-center gap-2 rounded bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-40"
          onClick={handleExport}
          disabled={highlights.length === 0 && stickyNotes.length === 0}
        >
          <Download size={16} />
          Export to Markdown
        </button>
      </div>
    </aside>
  );
}
