import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import DocSidebar from "../components/workspace/DocSidebar";
import DocPane from "../components/workspace/DocPane";
import { useAnnotationStore } from "../store/annotationStore";
import {
  getProject,
  listProjects,
  listDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  renameProject,
  type LocalDoc,
  type Project,
} from "../lib/localLibrary";
import { generateThumbnail, cacheThumbnail, removeCachedThumbnail } from "../lib/pdfThumbnail";

export default function ProjectWorkspace() {
  const { projectId = "", docId } = useParams();
  const navigate = useNavigate();
  const clearDocument = useAnnotationStore((s) => s.clearDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [docs, setDocs] = useState<LocalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);

  const activeDocId = docId ?? docs[0]?.id ?? null;

  const refresh = useCallback(() => {
    return listDocuments(projectId).then((d) =>
      setDocs(d.sort((a, b) => a.created_at.localeCompare(b.created_at))),
    );
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProject(projectId).then((p) => {
      if (cancelled) return;
      if (!p) {
        navigate("/", { replace: true });
        return;
      }
      setProject(p);
    });
    listProjects().then((ps) => !cancelled && setProjects(ps));
    refresh().finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId, refresh, navigate]);

  function selectDoc(id: string) {
    navigate(`/project/${projectId}/${id}`);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    let firstNewId: string | null = null;
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF`);
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const { dataUrl, pageCount } = await generateThumbnail(buffer.slice(0));
        const doc = await addDocument(file, {
          title: file.name.replace(/\.pdf$/i, ""),
          pageCount,
          projectId,
        });
        cacheThumbnail(doc.id, dataUrl);
        firstNewId ??= doc.id;
        toast.success(`Added ${doc.title}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not add PDF");
      }
    }
    await refresh();
    if (firstNewId) navigate(`/project/${projectId}/${firstNewId}`);
  }

  async function handleRenameDoc(id: string, title: string) {
    await updateDocument(id, { title });
    refresh();
  }

  async function handleMoveDoc(doc: LocalDoc, targetProjectId: string) {
    await updateDocument(doc.id, { project_id: targetProjectId });
    const remaining = docs.filter((d) => d.id !== doc.id);
    await refresh();
    const target = projects.find((p) => p.id === targetProjectId);
    toast.success(`Moved to ${target?.name ?? "project"}`);
    if (activeDocId === doc.id) {
      const next = remaining[0]?.id;
      navigate(next ? `/project/${projectId}/${next}` : `/project/${projectId}`, { replace: true });
    }
  }

  async function handleRenameProject(name: string) {
    await renameProject(projectId, name);
    setProject((p) => (p ? { ...p, name } : p));
    setProjects((ps) => ps.map((p) => (p.id === projectId ? { ...p, name } : p)));
  }

  async function handleDeleteDoc(doc: LocalDoc) {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    await deleteDocument(doc.id);
    removeCachedThumbnail(doc.id);
    clearDocument(doc.id);
    const remaining = docs.filter((d) => d.id !== doc.id);
    await refresh();
    toast.success("Deleted");
    if (activeDocId === doc.id) {
      const next = remaining[0]?.id;
      navigate(next ? `/project/${projectId}/${next}` : `/project/${projectId}`, { replace: true });
    }
  }

  return (
    <div
      className="relative flex h-screen bg-ink"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <DocSidebar
        project={project}
        projects={projects}
        documents={docs}
        activeDocId={activeDocId}
        onSelectDoc={selectDoc}
        onUploadClick={() => fileInputRef.current?.click()}
        onRenameDoc={handleRenameDoc}
        onMoveDoc={handleMoveDoc}
        onDeleteDoc={handleDeleteDoc}
        onRenameProject={handleRenameProject}
      />

      {activeDocId ? (
        <DocPane key={activeDocId} docId={activeDocId} />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 text-dim">
          {loading ? (
            <p>Loading…</p>
          ) : (
            <button
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink-4 px-16 py-12 hover:border-ink-5 hover:text-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} />
              <span className="text-sm">Upload or drop a PDF to start</span>
            </button>
          )}
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-[80] flex items-center justify-center bg-ink/70">
          <div className="rounded-xl border-2 border-dashed border-paper/50 px-12 py-10 text-center text-paper">
            <Upload size={32} className="mx-auto mb-2" />
            Drop PDF to add to this project
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
