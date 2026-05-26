// Fully local, offline document library backed by IndexedDB.
// PDFs are stored as Blobs (too large for localStorage); metadata lives alongside.
// No backend, no auth — this is a personal, browser-owned library.

export interface LocalDoc {
  id: string;
  title: string;
  filename: string;
  page_count: number | null;
  file_size_bytes: number | null;
  tags: string[];
  created_at: string;
  last_opened_at: string | null;
}

const DB_NAME = "research-studio-library";
const DB_VERSION = 1;
const DOCS_STORE = "documents";
const FILES_STORE = "files";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DOCS_STORE)) {
        db.createObjectStore(DOCS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function listDocuments(): Promise<LocalDoc[]> {
  const docs = await tx<LocalDoc[]>(DOCS_STORE, "readonly", (s) => s.getAll());
  return docs;
}

export async function getDocument(id: string): Promise<LocalDoc | null> {
  const doc = await tx<LocalDoc | undefined>(DOCS_STORE, "readonly", (s) => s.get(id));
  return doc ?? null;
}

export async function addDocument(
  file: File,
  meta: { title: string; pageCount: number },
): Promise<LocalDoc> {
  const id = crypto.randomUUID();
  await tx(FILES_STORE, "readwrite", (s) => s.put(file, id));
  const doc: LocalDoc = {
    id,
    title: meta.title,
    filename: file.name,
    page_count: meta.pageCount,
    file_size_bytes: file.size,
    tags: [],
    created_at: new Date().toISOString(),
    last_opened_at: null,
  };
  await tx(DOCS_STORE, "readwrite", (s) => s.put(doc));
  return doc;
}

export async function updateDocument(id: string, patch: Partial<LocalDoc>): Promise<void> {
  const existing = await getDocument(id);
  if (!existing) return;
  await tx(DOCS_STORE, "readwrite", (s) => s.put({ ...existing, ...patch, id }));
}

export async function deleteDocument(id: string): Promise<void> {
  await tx(FILES_STORE, "readwrite", (s) => s.delete(id));
  await tx(DOCS_STORE, "readwrite", (s) => s.delete(id));
}

/** Object URL for the stored PDF blob. Caller revokes it when done. */
export async function getFileUrl(id: string): Promise<string> {
  const blob = await tx<Blob | undefined>(FILES_STORE, "readonly", (s) => s.get(id));
  if (!blob) throw new Error("Document file not found");
  return URL.createObjectURL(blob);
}
