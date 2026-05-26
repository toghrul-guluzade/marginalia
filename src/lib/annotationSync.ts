import { create } from "zustand";
import toast from "react-hot-toast";
import {
  isSupabaseConfigured,
  saveAnnotation,
  deleteAnnotation,
} from "./supabase";
import type { Highlight, StickyNote } from "../types/annotation";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncStatusState {
  status: SyncStatus;
  setStatus: (s: SyncStatus) => void;
}

/** Tiny store the toolbar reads to render the sync indicator. */
export const useSyncStatus = create<SyncStatusState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));

// Set by useDocumentAnnotations once the user/doc are known.
let syncUserId: string | null = null;

export function setSyncUser(userId: string | null) {
  syncUserId = userId;
}

export function canSync(): boolean {
  return isSupabaseConfigured && !!syncUserId;
}

async function run(task: Promise<unknown>) {
  useSyncStatus.getState().setStatus("syncing");
  try {
    await task;
    useSyncStatus.getState().setStatus("synced");
  } catch {
    useSyncStatus.getState().setStatus("error");
    toast.error("Sync failed, saved locally");
  }
}

export function pushHighlight(h: Highlight) {
  if (!canSync()) return;
  void run(
    saveAnnotation({
      id: h.id,
      doc_id: h.docId,
      user_id: syncUserId as string,
      type: "highlight",
      page_number: h.rects[0]?.pageNumber ?? 1,
      data: h,
    }),
  );
}

export function pushStickyNote(n: StickyNote) {
  if (!canSync()) return;
  void run(
    saveAnnotation({
      id: n.id,
      doc_id: n.docId,
      user_id: syncUserId as string,
      type: "sticky_note",
      page_number: n.pageNumber,
      data: n,
    }),
  );
}

export function removeRemote(id: string) {
  if (!canSync()) return;
  void run(deleteAnnotation(id));
}
