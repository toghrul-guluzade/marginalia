import { useCallback, useEffect, useMemo, useState } from "react";
import { listDocuments, type LocalDoc } from "../lib/localLibrary";

export interface UseDocumentsResult {
  documents: LocalDoc[];
  filtered: LocalDoc[];
  allTags: string[];
  isLoading: boolean;
  query: string;
  setQuery: (q: string) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  refresh: () => void;
}

/** Reads the local (IndexedDB) document library and applies tag + search filters. */
export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<LocalDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    listDocuments()
      .then(setDocuments)
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
    query,
    setQuery,
    selectedTags,
    toggleTag,
    clearTags,
    refresh,
  };
}
