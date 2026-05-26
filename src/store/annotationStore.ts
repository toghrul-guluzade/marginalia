import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Highlight, StickyNote } from "../types/annotation";
import { pushHighlight, pushStickyNote, removeRemote } from "../lib/annotationSync";

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

  /** Merge server-fetched annotations into local state, dedup by id. */
  hydrate: (docId: string, highlights: Highlight[], stickyNotes: StickyNote[]) => void;
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) byId.set(item.id, item); // remote wins on conflict
  return [...byId.values()];
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      highlights: {},
      stickyNotes: {},

      addHighlight: (highlight) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [highlight.docId]: [...(state.highlights[highlight.docId] ?? []), highlight],
          },
        }));
        pushHighlight(highlight);
      },

      removeHighlight: (docId, id) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: (state.highlights[docId] ?? []).filter((h) => h.id !== id),
          },
        }));
        removeRemote(id);
      },

      updateHighlightNote: (docId, id, note) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: (state.highlights[docId] ?? []).map((h) =>
              h.id === id ? { ...h, note } : h,
            ),
          },
        }));
        const updated = (get().highlights[docId] ?? []).find((h) => h.id === id);
        if (updated) pushHighlight(updated);
      },

      updateHighlightColor: (docId, id, color) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: (state.highlights[docId] ?? []).map((h) =>
              h.id === id ? { ...h, color } : h,
            ),
          },
        }));
        const updated = (get().highlights[docId] ?? []).find((h) => h.id === id);
        if (updated) pushHighlight(updated);
      },

      addStickyNote: (note) => {
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [note.docId]: [...(state.stickyNotes[note.docId] ?? []), note],
          },
        }));
        pushStickyNote(note);
      },

      removeStickyNote: (docId, id) => {
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [docId]: (state.stickyNotes[docId] ?? []).filter((n) => n.id !== id),
          },
        }));
        removeRemote(id);
      },

      updateStickyNote: (docId, id, patch) => {
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [docId]: (state.stickyNotes[docId] ?? []).map((n) =>
              n.id === id ? { ...n, ...patch } : n,
            ),
          },
        }));
        const updated = (get().stickyNotes[docId] ?? []).find((n) => n.id === id);
        if (updated) pushStickyNote(updated);
      },

      hydrate: (docId, highlights, stickyNotes) =>
        set((state) => ({
          highlights: {
            ...state.highlights,
            [docId]: mergeById(state.highlights[docId] ?? [], highlights),
          },
          stickyNotes: {
            ...state.stickyNotes,
            [docId]: mergeById(state.stickyNotes[docId] ?? [], stickyNotes),
          },
        })),
    }),
    { name: "research-studio-annotations" },
  ),
);
