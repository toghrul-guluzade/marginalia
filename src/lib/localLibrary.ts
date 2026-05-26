// Fully local, offline library backed by IndexedDB. No backend, no auth.
// Projects group documents; each document belongs to exactly one project.
// PDFs are stored as Blobs (too large for localStorage); metadata lives alongside.

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface LocalDoc {
  id: string;
  project_id: string;
  title: string;
  filename: string;
  page_count: number | null;
  file_size_bytes: number | null;
  tags: string[];
  created_at: string;
  last_opened_at: string | null;
}

const DB_NAME = "research-studio-library";
const DB_VERSION = 2;
const DOCS_STORE = "documents";
const FILES_STORE = "files";
const PROJECTS_STORE = "projects";

const DEFAULT_PROJECT_ID = "default-project";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const txn = req.transaction!;
      if (!db.objectStoreNames.contains(DOCS_STORE)) {
        db.createObjectStore(DOCS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
      // v2: introduce projects and migrate any orphan documents into a default project.
      if (event.oldVersion < 2) {
        const projects = db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
        projects.put({
          id: DEFAULT_PROJECT_ID,
          name: "My Documents",
          created_at: new Date().toISOString(),
        } satisfies Project);

        const docs = txn.objectStore(DOCS_STORE);
        docs.openCursor().onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (!cursor) return;
          const doc = cursor.value as LocalDoc;
          if (!doc.project_id) {
            cursor.update({ ...doc, project_id: DEFAULT_PROJECT_ID });
          }
          cursor.continue();
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  run: (t: IDBTransaction) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(stores, mode);
        const req = run(t);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ── Projects ────────────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  return tx<Project[]>(PROJECTS_STORE, "readonly", (t) => t.objectStore(PROJECTS_STORE).getAll());
}

export async function getProject(id: string): Promise<Project | null> {
  const p = await tx<Project | undefined>(PROJECTS_STORE, "readonly", (t) =>
    t.objectStore(PROJECTS_STORE).get(id),
  );
  return p ?? null;
}

export async function createProject(name: string): Promise<Project> {
  const project: Project = {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled project",
    created_at: new Date().toISOString(),
  };
  await tx(PROJECTS_STORE, "readwrite", (t) => t.objectStore(PROJECTS_STORE).put(project));
  return project;
}

export async function renameProject(id: string, name: string): Promise<void> {
  const existing = await getProject(id);
  if (!existing) return;
  await tx(PROJECTS_STORE, "readwrite", (t) =>
    t.objectStore(PROJECTS_STORE).put({ ...existing, name: name.trim() || existing.name }),
  );
}

/** Deletes a project and all of its documents + files. Returns deleted doc ids
 *  so the caller can clear their thumbnails and annotations. */
export async function deleteProject(id: string): Promise<string[]> {
  const docs = (await listAllDocuments()).filter((d) => d.project_id === id);
  for (const doc of docs) {
    await tx(FILES_STORE, "readwrite", (t) => t.objectStore(FILES_STORE).delete(doc.id));
    await tx(DOCS_STORE, "readwrite", (t) => t.objectStore(DOCS_STORE).delete(doc.id));
  }
  await tx(PROJECTS_STORE, "readwrite", (t) => t.objectStore(PROJECTS_STORE).delete(id));
  return docs.map((d) => d.id);
}

// ── Documents ─────────────────────────────────────────────────────────────

async function listAllDocuments(): Promise<LocalDoc[]> {
  return tx<LocalDoc[]>(DOCS_STORE, "readonly", (t) => t.objectStore(DOCS_STORE).getAll());
}

export async function listDocuments(projectId: string): Promise<LocalDoc[]> {
  const all = await listAllDocuments();
  return all.filter((d) => d.project_id === projectId);
}

/** Number of documents per project id. */
export async function documentCounts(): Promise<Record<string, number>> {
  const all = await listAllDocuments();
  const counts: Record<string, number> = {};
  for (const d of all) counts[d.project_id] = (counts[d.project_id] ?? 0) + 1;
  return counts;
}

export async function getDocument(id: string): Promise<LocalDoc | null> {
  const doc = await tx<LocalDoc | undefined>(DOCS_STORE, "readonly", (t) =>
    t.objectStore(DOCS_STORE).get(id),
  );
  return doc ?? null;
}

export async function addDocument(
  file: File,
  meta: { title: string; pageCount: number; projectId: string },
): Promise<LocalDoc> {
  const id = crypto.randomUUID();
  await tx(FILES_STORE, "readwrite", (t) => t.objectStore(FILES_STORE).put(file, id));
  const doc: LocalDoc = {
    id,
    project_id: meta.projectId,
    title: meta.title,
    filename: file.name,
    page_count: meta.pageCount,
    file_size_bytes: file.size,
    tags: [],
    created_at: new Date().toISOString(),
    last_opened_at: null,
  };
  await tx(DOCS_STORE, "readwrite", (t) => t.objectStore(DOCS_STORE).put(doc));
  return doc;
}

export async function updateDocument(id: string, patch: Partial<LocalDoc>): Promise<void> {
  const existing = await getDocument(id);
  if (!existing) return;
  await tx(DOCS_STORE, "readwrite", (t) =>
    t.objectStore(DOCS_STORE).put({ ...existing, ...patch, id }),
  );
}

export async function deleteDocument(id: string): Promise<void> {
  await tx(FILES_STORE, "readwrite", (t) => t.objectStore(FILES_STORE).delete(id));
  await tx(DOCS_STORE, "readwrite", (t) => t.objectStore(DOCS_STORE).delete(id));
}

/** Object URL for the stored PDF blob. Caller revokes it when done. */
export async function getFileUrl(id: string): Promise<string> {
  const blob = await tx<Blob | undefined>(FILES_STORE, "readonly", (t) =>
    t.objectStore(FILES_STORE).get(id),
  );
  if (!blob) throw new Error("Document file not found");
  return URL.createObjectURL(blob);
}
