import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import DocSidebar from "../components/workspace/DocSidebar";
import DocPane from "../components/workspace/DocPane";
import { useAnnotationStore } from "../store/annotationStore";
import {
  getProject,
  listDocuments,
  addDocument,
  deleteDocument,
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
  const [docs, setDocs] = useState<LocalDoc[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="flex h-screen bg-ink">
      <DocSidebar
        projectName={project?.name ?? "…"}
        documents={docs}
        activeDocId={activeDocId}
        onSelectDoc={selectDoc}
        onUploadClick={() => fileInputRef.current?.click()}
        onDeleteDoc={handleDeleteDoc}
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
              <span className="text-sm">Upload a PDF to start</span>
            </button>
          )}
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
