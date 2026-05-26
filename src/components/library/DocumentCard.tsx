import { useEffect, useRef, useState } from "react";
import { FileText, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAnnotationStore } from "../../store/annotationStore";
import { getCachedThumbnail } from "../../lib/pdfThumbnail";
import { tagColor } from "../../lib/tagColors";
import AddTagDropdown from "./AddTagDropdown";
import type { LocalDoc } from "../../lib/localLibrary";

interface DocumentCardProps {
  doc: LocalDoc;
  existingTags: string[];
  onRename: (id: string, title: string) => void;
  onAddTag: (doc: LocalDoc, tag: string) => void;
  onDelete: (doc: LocalDoc) => void;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DocumentCard({ doc, existingTags, onRename, onAddTag, onDelete }: DocumentCardProps) {
  const navigate = useNavigate();
  const highlights = useAnnotationStore((s) => s.highlights[doc.id]?.length ?? 0);
  const notes = useAnnotationStore((s) => s.stickyNotes[doc.id]?.length ?? 0);
  const annotationCount = highlights + notes;

  const thumb = getCachedThumbnail(doc.id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [menuOpen]);

  function commitTitle() {
    setEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== doc.title) onRename(doc.id, trimmed);
    else setTitle(doc.title);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <button
        className="flex aspect-[3/4] items-center justify-center bg-gray-50"
        onClick={() => navigate(`/doc/${doc.id}`)}
        aria-label={`Open ${doc.title}`}
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <FileText size={48} className="text-gray-300" />
        )}
      </button>

      {annotationCount > 0 && (
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
          {annotationCount}
        </span>
      )}

      {/* Three-dot menu */}
      <div className="absolute right-2 top-2" ref={menuRef}>
        <button
          className="rounded bg-white/90 p-1 text-gray-500 opacity-0 shadow group-hover:opacity-100 hover:bg-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Document menu"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-10 mt-1 w-32 rounded border border-gray-200 bg-white py-1 text-sm shadow-lg">
            <button
              className="block w-full px-3 py-1.5 text-left hover:bg-gray-50"
              onClick={() => { setMenuOpen(false); setEditing(true); }}
            >
              Rename
            </button>
            <button
              className="block w-full px-3 py-1.5 text-left hover:bg-gray-50"
              onClick={() => { setMenuOpen(false); setTagOpen(true); }}
            >
              Add tag
            </button>
            <button
              className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
              onClick={() => { setMenuOpen(false); onDelete(doc); }}
            >
              Delete
            </button>
          </div>
        )}
        {tagOpen && (
          <AddTagDropdown
            existingTags={existingTags}
            currentTags={doc.tags ?? []}
            onAdd={(tag) => onAddTag(doc, tag)}
            onClose={() => setTagOpen(false)}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {editing ? (
          <input
            autoFocus
            className="w-full rounded border border-gray-200 px-1 text-sm focus:border-brand focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") { setTitle(doc.title); setEditing(false); }
            }}
          />
        ) : (
          <h3
            className="truncate text-sm font-medium text-gray-800"
            title={doc.title}
            onDoubleClick={() => setEditing(true)}
          >
            {doc.title}
          </h3>
        )}

        <p className="text-xs text-gray-400">
          {formatSize(doc.file_size_bytes)} · {doc.page_count ?? "—"} pages
        </p>

        {doc.tags?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {doc.tags.map((tag) => {
              const c = tagColor(tag);
              return (
                <span
                  key={tag}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <p className="mt-auto pt-1 text-[11px] text-gray-400">
          {doc.last_opened_at
            ? `Opened ${new Date(doc.last_opened_at).toLocaleDateString()}`
            : `Added ${new Date(doc.created_at).toLocaleDateString()}`}
        </p>
      </div>
    </div>
  );
}
