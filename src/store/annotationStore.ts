import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Highlight, StickyNote } from "../types/annotation";

interface AnnotationState {
  /** Highlights keyed by docId. */
  highlights: Record<string, Highlight[]>;
  /** Sticky notes keyed by docId. */
  stickyNotes: Record<string, StickyNote[]>;

  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (docId: string, id: string) => void;
  updateHighlightNote: (docId: string, id: string, note: string) => void;
  updateHighlightColor: (docId: string, id: string, color: Highlight["color"]) => void;

  addStickyNote: (note: StickyNote) => void;
  removeStickyNote: (docId: string, id: string) => void;
  updateStickyNote: (docId: string, id: string, patch: Partial<StickyNote>) => void;
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set) => ({
      highlights: {},
      stickyNotes: {},

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

      addStickyNote: (note) =>
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [note.docId]: [...(state.stickyNotes[note.docId] ?? []), note],
          },
        })),

      removeStickyNote: (docId, id) =>
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [docId]: (state.stickyNotes[docId] ?? []).filter((n) => n.id !== id),
          },
        })),

      updateStickyNote: (docId, id, patch) =>
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [docId]: (state.stickyNotes[docId] ?? []).map((n) =>
              n.id === id ? { ...n, ...patch } : n,
            ),
          },
        })),
    }),
    { name: "research-studio-annotations" },
  ),
);
