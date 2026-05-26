import { Link } from "react-router-dom";
import { Upload, ChevronLeft, Trash2 } from "lucide-react";
import { useAnnotationStore } from "../../store/annotationStore";
import type { LocalDoc } from "../../lib/localLibrary";

interface DocSidebarProps {
  projectName: string;
  documents: LocalDoc[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onUploadClick: () => void;
  onDeleteDoc: (doc: LocalDoc) => void;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DocItem({
  doc,
  active,
  onSelect,
  onDelete,
}: {
  doc: LocalDoc;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const count = useAnnotationStore(
    (s) => (s.highlights[doc.id]?.length ?? 0) + (s.stickyNotes[doc.id]?.length ?? 0),
  );
  const sub = [doc.page_count ? `${doc.page_count} pages` : null, formatSize(doc.file_size_bytes)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`group mb-0.5 flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors ${
        active ? "border-rule bg-ink-3" : "border-transparent hover:bg-ink-3"
      }`}
      onClick={onSelect}
    >
      <div className="mt-0.5 flex h-8 w-7 shrink-0 items-center justify-center rounded bg-ink-4 font-mono text-[10px] text-dim">
        PDF
      </div>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[12.5px] leading-snug ${active ? "text-cream" : "text-ghost"}`}>
          {doc.title}
        </div>
        {sub && <div className="mt-0.5 font-mono text-[11px] text-ink-5">{sub}</div>}
      </div>
      {count > 0 && (
        <span className="mt-0.5 shrink-0 rounded bg-ink-3 px-1.5 font-mono text-[10px] text-dim group-hover:bg-ink-4">
          {count}
        </span>
      )}
      <button
        className="mt-0.5 shrink-0 text-ink-5 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete ${doc.title}`}
        title="Delete document"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function DocSidebar({
  projectName,
  documents,
  activeDocId,
  onSelectDoc,
  onUploadClick,
  onDeleteDoc,
}: DocSidebarProps) {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-rule bg-ink-2">
      <div className="border-b border-rule px-4 py-3">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-dim hover:text-ghost">
          <ChevronLeft size={14} /> Projects
        </Link>
        <h1 className="mt-1.5 truncate font-serif text-lg text-paper" title={projectName}>
          {projectName}
        </h1>
      </div>

      <div className="px-5 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
        Documents
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {documents.length === 0 ? (
          <p className="px-3 py-4 text-sm text-ink-5">No documents yet.</p>
        ) : (
          documents.map((doc) => (
            <DocItem
              key={doc.id}
              doc={doc}
              active={doc.id === activeDocId}
              onSelect={() => onSelectDoc(doc.id)}
              onDelete={() => onDeleteDoc(doc)}
            />
          ))
        )}
      </div>

      <div className="border-t border-rule p-3">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-ink-4 py-2.5 text-xs text-dim transition-colors hover:border-ink-5 hover:bg-ink-3 hover:text-ghost"
          onClick={onUploadClick}
        >
          <Upload size={14} />
          Upload PDF
        </button>
      </div>
    </aside>
  );
}
