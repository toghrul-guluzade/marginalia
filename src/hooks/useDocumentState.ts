import { useCallback } from "react";

export interface DocViewState {
  scrollY: number;
  zoom: number;
  page: number;
}

const KEY = "research-studio-doc-state";

function readAll(): Record<string, DocViewState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Persists and restores per-document scroll position, zoom, and page. */
export function useDocumentState(docId: string) {
  const restore = useCallback((): DocViewState | null => {
    return readAll()[docId] ?? null;
  }, [docId]);

  const save = useCallback(
    (state: DocViewState) => {
      const all = readAll();
      all[docId] = state;
      try {
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        /* quota — ignore */
      }
    },
    [docId],
  );

  return { restore, save };
}
