import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Highlight } from "../types/annotation";

interface AnnotationState {
  /** Highlights keyed by docId. */
  highlights: Record<string, Highlight[]>;

  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (docId: string, id: string) => void;
  updateHighlightNote: (docId: string, id: string, note: string) => void;
  updateHighlightColor: (docId: string, id: string, color: Highlight["color"]) => void;
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set) => ({
      highlights: {},

      addHighlight: (highlight) =>
        set((state) => ({
          highlights: {
            ...state.highlights,
            [highlight.docId]: [...(state.highlights[highlight.docId] ?? []), highlight],
          },
        })),

      removeHighlight: (docId, id) =>
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: (state.highlights[docId] ?? []).filter((h) => h.id !== id),
          },
        })),

      updateHighlightNote: (docId, id, note) =>
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: (state.highlights[docId] ?? []).map((h) =>
              h.id === id ? { ...h, note } : h,
            ),
          },
        })),

      updateHighlightColor: (docId, id, color) =>
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: (state.highlights[docId] ?? []).map((h) =>
              h.id === id ? { ...h, color } : h,
            ),
          },
        })),
    }),
    { name: "research-studio-annotations" },
  ),
);
