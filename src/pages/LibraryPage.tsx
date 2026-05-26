import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Upload, LogOut, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useDocuments } from "../hooks/useDocuments";
import { useAnnotationStore } from "../store/annotationStore";
import DocumentCard from "../components/library/DocumentCard";
import {
  isSupabaseConfigured,
  uploadPDF,
  updateDocument,
  deleteDocument,
  type DocumentRow,
} from "../lib/supabase";
import { generateThumbnail, cacheThumbnail } from "../lib/pdfThumbnail";

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    documents,
    filtered,
    allTags,
    isLoading,
    query,
    setQuery,
    selectedTags,
    toggleTag,
    clearTags,
    refresh,
  } = useDocuments();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<"lastOpened" | "dateAdded" | "title" | "annotations">(
    "lastOpened",
  );
  const highlightsMap = useAnnotationStore((s) => s.highlights);
  const stickyNotesMap = useAnnotationStore((s) => s.stickyNotes);

  const sorted = useMemo(() => {
    const countFor = (id: string) =>
      (highlightsMap[id]?.length ?? 0) + (stickyNotesMap[id]?.length ?? 0);
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title);
        case "dateAdded":
          return b.created_at.localeCompare(a.created_at);
        case "annotations":
          return countFor(b.id) - countFor(a.id);
        default: {
          const av = a.last_opened_at ?? a.created_at;
          const bv = b.last_opened_at ?? b.created_at;
          return bv.localeCompare(av);
        }
      }
    });
  }, [filtered, sortKey, highlightsMap, stickyNotesMap]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error("Sign in to upload");
      return;
    }
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF`);
        continue;
      }
      try {
        setUploadProgress(10);
        const buffer = await file.arrayBuffer();
        const { dataUrl, pageCount } = await generateThumbnail(buffer.slice(0));
        setUploadProgress(50);
        const doc = await uploadPDF(file, user.id, {
          title: file.name.replace(/\.pdf$/i, ""),
          pageCount,
        });
        cacheThumbnail(doc.id, dataUrl);
        setUploadProgress(100);
        toast.success(`Uploaded ${doc.title}`);
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadProgress(null);
      }
    }
  }

  async function handleRename(id: string, title: string) {
    try {
      await updateDocument(id, { title });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    }
  }

  async function handleAddTag(doc: DocumentRow, tag: string) {
    try {
      await updateDocument(doc.id, { tags: [...new Set([...(doc.tags ?? []), tag])] });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add tag");
    }
  }

  async function handleDelete(doc: DocumentRow) {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(doc);
      toast.success("Deleted");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
        <span className="text-lg font-semibold text-brand-dark">Research Studio</span>
        {import.meta.env.VITE_BLOG_URL && (
          <a
            href={import.meta.env.VITE_BLOG_URL}
            className="text-sm text-gray-500 hover:text-brand"
          >
            ← Back to blog
          </a>
        )}
        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded border border-gray-200 px-2">
          <Search size={16} className="text-gray-400" />
          <input
            className="w-full py-1.5 text-sm focus:outline-none"
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {isSupabaseConfigured && (
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-medium text-white"
              title={user?.email ?? ""}
            >
              {initials}
            </span>
            <button
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
              onClick={() => signOut().then(() => navigate("/auth"))}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Tag filter sidebar */}
        <aside className="hidden w-56 shrink-0 overflow-auto border-r border-gray-200 bg-white p-3 sm:block">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tags</h2>
            {selectedTags.length > 0 && (
              <button className="text-xs text-brand hover:underline" onClick={clearTags}>
                Clear
              </button>
            )}
          </div>
          {allTags.length === 0 && <p className="text-sm text-gray-400">No tags yet</p>}
          <ul className="flex flex-col gap-1">
            {allTags.map((tag) => {
              const count = documents.filter((d) => d.tags?.includes(tag)).length;
              const active = selectedTags.includes(tag);
              return (
                <li key={tag}>
                  <button
                    className={`flex w-full items-center justify-between rounded px-2 py-1 text-sm ${
                      active ? "bg-brand-light text-brand-dark" : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    <span className="truncate">{tag}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main grid */}
        <main className="relative min-w-0 flex-1 overflow-auto p-4">
          {!isSupabaseConfigured ? (
            <div className="mx-auto mt-12 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="font-medium text-amber-800">Connect Supabase to use your library</p>
              <p className="mt-1 text-sm text-amber-700">
                Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in{" "}
                <code>.env.local</code>, then run the SQL in <code>supabase/schema.sql</code>.
              </p>
              <Link to="/doc/test" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
                Try the demo viewer →
              </Link>
            </div>
          ) : isLoading ? (
            <p className="mt-12 text-center text-gray-400">Loading your library…</p>
          ) : documents.length === 0 ? (
            <button
              className="mx-auto mt-8 flex h-64 w-full max-w-2xl flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} />
              <span className="text-sm font-medium">Drop a PDF here or click to upload</span>
            </button>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">{sorted.length} documents</p>
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  Sort by
                  <select
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                  >
                    <option value="lastOpened">Last opened</option>
                    <option value="dateAdded">Date added</option>
                    <option value="title">Title A–Z</option>
                    <option value="annotations">Most annotations</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    existingTags={allTags}
                    onRename={handleRename}
                    onAddTag={handleAddTag}
                    onDelete={handleDelete}
                  />
                ))}
                {sorted.length === 0 && (
                  <p className="col-span-full mt-8 text-center text-gray-400">
                    No documents match your filters.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Floating upload button (when docs exist) */}
          {isSupabaseConfigured && documents.length > 0 && (
            <button
              className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload PDF"
            >
              <Plus size={24} />
            </button>
          )}

          {/* Upload progress */}
          {uploadProgress !== null && (
            <div className="fixed bottom-6 left-1/2 w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>Uploading…</span>
                <X size={14} className="opacity-0" />
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-gray-100">
                <div className="h-full bg-brand transition-all" style={{ width: `${uploadProgress}%` }} />
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
        </main>
      </div>
    </div>
  );
}
