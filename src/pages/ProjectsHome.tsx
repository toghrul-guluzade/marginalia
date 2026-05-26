import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, MoreVertical, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useAnnotationStore } from "../store/annotationStore";
import Menu, { MenuItem } from "../components/ui/Menu";
import {
  listProjects,
  createProject,
  renameProject,
  deleteProject,
  documentCounts,
  type Project,
} from "../lib/localLibrary";
import { removeCachedThumbnail } from "../lib/pdfThumbnail";

export default function ProjectsHome() {
  const navigate = useNavigate();
  const clearDocument = useAnnotationStore((s) => s.clearDocument);
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [ps, cs] = await Promise.all([listProjects(), documentCounts()]);
      setProjects(ps.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      setCounts(cs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load projects");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate() {
    const name = newName.trim() || "Untitled project";
    try {
      const project = await createProject(name);
      setNewName("");
      navigate(`/project/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create project");
    }
  }

  async function handleRename(id: string, name: string) {
    setEditingId(null);
    if (name.trim()) {
      await renameProject(id, name.trim());
      refresh();
    }
  }

  async function handleDelete(project: Project) {
    const n = counts[project.id] ?? 0;
    if (!window.confirm(`Delete "${project.name}"${n ? ` and its ${n} document(s)` : ""}? This cannot be undone.`))
      return;
    const docIds = await deleteProject(project.id);
    docIds.forEach((id) => {
      removeCachedThumbnail(id);
      clearDocument(id);
    });
    toast.success("Project deleted");
    refresh();
  }

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="border-b border-rule px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-paper">
            <FileText size={15} className="text-ink" />
          </div>
          <span className="font-serif text-xl">Research Studio</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2">
          <input
            className="w-64 rounded-md border border-ink-4 bg-ink-2 px-3 py-2 text-sm text-paper placeholder:text-ink-5 focus:border-ink-5 focus:outline-none"
            placeholder="New project name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            className="flex items-center gap-1.5 rounded-md bg-paper px-3 py-2 text-sm font-medium text-ink hover:opacity-90"
            onClick={handleCreate}
          >
            <Plus size={16} /> Create project
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="mt-16 text-center text-dim">No projects yet. Create one above to get started.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group relative cursor-pointer rounded-xl border border-rule bg-ink-2 p-5 transition-colors hover:border-ink-4 hover:bg-ink-3"
                onClick={() => editingId !== p.id && navigate(`/project/${p.id}`)}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-ink-3 text-dim">
                  <FolderOpen size={18} />
                </div>

                {editingId === p.id ? (
                  <input
                    ref={editRef}
                    autoFocus
                    defaultValue={p.name}
                    className="w-full rounded border border-ink-4 bg-ink-3 px-1.5 py-0.5 font-serif text-lg text-paper focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => handleRename(p.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(p.id, (e.target as HTMLInputElement).value);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <h2
                    className="truncate font-serif text-lg text-cream"
                    title={p.name}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(p.id);
                    }}
                  >
                    {p.name}
                  </h2>
                )}

                <p className="mt-1 font-mono text-xs text-dim">
                  {(counts[p.id] ?? 0)} document{(counts[p.id] ?? 0) === 1 ? "" : "s"}
                </p>

                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <Menu
                    triggerLabel={`${p.name} menu`}
                    triggerClassName="rounded p-1 text-ink-5 hover:bg-ink-4 hover:text-paper"
                    trigger={<MoreVertical size={16} />}
                  >
                    {(close) => (
                      <>
                        <MenuItem onClick={() => { close(); setEditingId(p.id); }}>Rename</MenuItem>
                        <MenuItem danger onClick={() => { close(); handleDelete(p); }}>Delete</MenuItem>
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
