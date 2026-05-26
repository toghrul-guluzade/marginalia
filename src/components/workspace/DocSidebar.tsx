import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, ChevronLeft, MoreVertical, FilePlus } from "lucide-react";
import { useAnnotationStore } from "../../store/annotationStore";
import Menu, { MenuItem } from "../ui/Menu";
import type { LocalDoc, Project } from "../../lib/localLibrary";

interface DocSidebarProps {
  project: Project | null;
  projects: Project[];
  documents: LocalDoc[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onUploadClick: () => void;
  onNewNote: () => void;
  onRenameDoc: (id: string, title: string) => void;
  onMoveDoc: (doc: LocalDoc, projectId: string) => void;
  onDeleteDoc: (doc: LocalDoc) => void;
  onRenameProject: (name: string) => void;
}

function kindBadge(doc: LocalDoc): string {
  if (doc.kind !== "text") return "PDF";
  return /\.txt$/i.test(doc.filename) ? "TXT" : "MD";
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DocItem({
  doc,
  active,
  projects,
  onSelect,
  onRename,
  onMove,
  onDelete,
}: {
  doc: LocalDoc;
  active: boolean;
  projects: Project[];
  onSelect: () => void;
  onRename: (title: string) => void;
  onMove: (projectId: string) => void;
  onDelete: () => void;
}) {
  const count = useAnnotationStore(
    (s) => (s.highlights[doc.id]?.length ?? 0) + (s.stickyNotes[doc.id]?.length ?? 0),
  );
  const [editing, setEditing] = useState(false);
  const sub = [doc.page_count ? `${doc.page_count} pages` : null, formatSize(doc.file_size_bytes)]
    .filter(Boolean)
    .join(" · ");
  const otherProjects = projects.filter((p) => p.id !== doc.project_id);

  return (
    <div
      className={`group mb-0.5 flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors ${
        active ? "border-rule bg-ink-3" : "border-transparent hover:bg-ink-3"
      }`}
      onClick={onSelect}
    >
      <div className="mt-0.5 flex h-8 w-7 shrink-0 items-center justify-center rounded bg-ink-4 font-mono text-[9px] text-dim">
        {kindBadge(doc)}
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={doc.title}
            className="w-full rounded border border-ink-4 bg-ink-3 px-1 py-0.5 text-[12.5px] text-paper focus:outline-none"
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              setEditing(false);
              if (e.target.value.trim()) onRename(e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <div
            className={`truncate text-[12.5px] leading-snug ${active ? "text-cream" : "text-ghost"}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {doc.title}
          </div>
        )}
        {sub && <div className="mt-0.5 font-mono text-[11px] text-ink-5">{sub}</div>}
      </div>

      {count > 0 && (
        <span className="mt-0.5 shrink-0 rounded bg-ink-3 px-1.5 font-mono text-[10px] text-dim group-hover:bg-ink-4">
          {count}
        </span>
      )}

      <Menu
        triggerLabel="Document menu"
        triggerClassName="mt-0.5 shrink-0 rounded p-0.5 text-ink-5 opacity-0 hover:text-paper group-hover:opacity-100"
        trigger={<MoreVertical size={14} />}
      >
        {(close) => (
          <>
            <MenuItem onClick={() => { close(); setEditing(true); }}>Rename</MenuItem>
            {otherProjects.length > 0 && (
              <>
                <div className="px-3 pt-1.5 pb-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-5">
                  Move to
                </div>
                {otherProjects.map((p) => (
                  <MenuItem key={p.id} onClick={() => { close(); onMove(p.id); }}>
                    {p.name}
                  </MenuItem>
                ))}
                <div className="my-1 h-px bg-rule" />
              </>
            )}
            <MenuItem danger onClick={() => { close(); onDelete(); }}>
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}

export default function DocSidebar({
  project,
  projects,
  documents,
  activeDocId,
  onSelectDoc,
  onUploadClick,
  onNewNote,
  onRenameDoc,
  onMoveDoc,
  onDeleteDoc,
  onRenameProject,
}: DocSidebarProps) {
  const [editingName, setEditingName] = useState(false);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-rule bg-ink-2">
      <div className="border-b border-rule px-4 py-3">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-dim hover:text-ghost">
          <ChevronLeft size={14} /> Projects
        </Link>
        {editingName ? (
          <input
            autoFocus
            defaultValue={project?.name ?? ""}
            className="mt-1.5 w-full rounded border border-ink-4 bg-ink-3 px-1 py-0.5 font-serif text-lg text-paper focus:outline-none"
            onBlur={(e) => {
              setEditingName(false);
              if (e.target.value.trim()) onRenameProject(e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingName(false);
            }}
          />
        ) : (
          <h1
            className="mt-1.5 truncate font-serif text-lg text-paper"
            title="Double-click to rename"
            onDoubleClick={() => setEditingName(true)}
          >
            {project?.name ?? "…"}
          </h1>
        )}
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
              projects={projects}
              onSelect={() => onSelectDoc(doc.id)}
              onRename={(title) => onRenameDoc(doc.id, title)}
              onMove={(projectId) => onMoveDoc(doc, projectId)}
              onDelete={() => onDeleteDoc(doc)}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-rule p-3">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-ink-4 py-2.5 text-xs text-dim transition-colors hover:border-ink-5 hover:bg-ink-3 hover:text-ghost"
          onClick={onUploadClick}
        >
          <Upload size={14} />
          Upload PDF / .md / .txt
        </button>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md py-1.5 text-xs text-dim transition-colors hover:text-ghost"
          onClick={onNewNote}
        >
          <FilePlus size={14} />
          New note
        </button>
      </div>
    </aside>
  );
}
