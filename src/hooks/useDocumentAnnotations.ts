import { useEffect } from "react";
import { useAnnotationStore } from "../store/annotationStore";
import { getAnnotations, isSupabaseConfigured } from "../lib/supabase";
import { setSyncUser, useSyncStatus } from "../lib/annotationSync";
import { useAuth } from "./useAuth";
import type { Highlight, StickyNote } from "../types/annotation";

/**
 * On mount, fetches the document's annotations from Supabase, merges them with
 * any local-only annotations (dedup by id), and hydrates the store. Also wires
 * the current user into the background sync layer.
 */
export function useDocumentAnnotations(docId: string) {
  const hydrate = useAnnotationStore((s) => s.hydrate);
  const { user } = useAuth();
  const setStatus = useSyncStatus((s) => s.setStatus);

  useEffect(() => {
    setSyncUser(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    let cancelled = false;
    setStatus("syncing");
    getAnnotations(docId)
      .then((rows) => {
        if (cancelled) return;
        const highlights: Highlight[] = [];
        const stickyNotes: StickyNote[] = [];
        for (const row of rows) {
          if (row.type === "highlight") highlights.push(row.data as Highlight);
          else stickyNotes.push(row.data as StickyNote);
        }
        hydrate(docId, highlights, stickyNotes);
        setStatus("synced");
      })
      .catch(() => setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [docId, user, hydrate, setStatus]);
}
