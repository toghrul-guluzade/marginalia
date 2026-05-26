import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDocuments,
  isSupabaseConfigured,
  type DocumentRow,
} from "../lib/supabase";

export interface UseDocumentsResult {
  documents: DocumentRow[];
  filtered: DocumentRow[];
  allTags: string[];
  isLoading: boolean;
  error: Error | null;
  query: string;
  setQuery: (q: string) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  refresh: () => void;
}

export type SortKey = "lastOpened" | "dateAdded" | "title" | "annotations";

/** Fetches the current user's documents and applies tag + search filters. */
export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getDocuments()
      .then((docs) => {
        setDocuments(docs);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => d.tags?.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (q && !d.title.toLowerCase().includes(q)) return false;
      // AND filter: doc must contain every selected tag.
      if (selectedTags.length && !selectedTags.every((t) => d.tags?.includes(t))) return false;
      return true;
    });
  }, [documents, query, selectedTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearTags = useCallback(() => setSelectedTags([]), []);

  return {
    documents,
    filtered,
    allTags,
    isLoading,
    error,
    query,
    setQuery,
    selectedTags,
    toggleTag,
    clearTags,
    refresh,
  };
}
