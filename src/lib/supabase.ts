import { createClient } from "@supabase/supabase-js";
import type { Highlight, StickyNote } from "../types/annotation";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when real credentials are present (not the placeholder values). */
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.startsWith("your_") && !anonKey.startsWith("your_");

// Construct the client even with placeholder values (construction is inert);
// network calls are gated on `isSupabaseConfigured` by the UI/hooks.
export const supabase = createClient(url ?? "http://localhost", anonKey ?? "anon");

export interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  storage_path: string;
  page_count: number | null;
  file_size_bytes: number | null;
  tags: string[];
  created_at: string;
  last_opened_at: string | null;
}

export interface AnnotationRow {
  id: string;
  doc_id: string;
  user_id: string;
  type: "highlight" | "sticky_note";
  page_number: number;
  data: Highlight | StickyNote;
  created_at: string;
}

/** Upload a PDF to the user's private folder and create its document row. */
export async function uploadPDF(
  file: File,
  userId: string,
  meta: { title: string; pageCount: number },
): Promise<DocumentRow> {
  const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("pdfs")
    .upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      title: meta.title,
      filename: file.name,
      storage_path: path,
      page_count: meta.pageCount,
      file_size_bytes: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DocumentRow;
}

export async function getDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function getDocument(docId: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase.from("documents").select("*").eq("id", docId).maybeSingle();
  if (error) throw error;
  return (data as DocumentRow) ?? null;
}

export async function updateDocument(docId: string, patch: Partial<DocumentRow>): Promise<void> {
  const { error } = await supabase.from("documents").update(patch).eq("id", docId);
  if (error) throw error;
}

export async function deleteDocument(doc: DocumentRow): Promise<void> {
  await supabase.storage.from("pdfs").remove([doc.storage_path]);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

/** A time-limited signed URL to stream the private PDF into the viewer. */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("pdfs")
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function saveAnnotation(
  row: Omit<AnnotationRow, "created_at" | "user_id"> & { user_id: string },
): Promise<void> {
  const { error } = await supabase
    .from("annotations")
    .upsert({ ...row }, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { error } = await supabase.from("annotations").delete().eq("id", id);
  if (error) throw error;
}

export async function getAnnotations(docId: string): Promise<AnnotationRow[]> {
  const { data, error } = await supabase
    .from("annotations")
    .select("*")
    .eq("doc_id", docId);
  if (error) throw error;
  return (data ?? []) as AnnotationRow[];
}
