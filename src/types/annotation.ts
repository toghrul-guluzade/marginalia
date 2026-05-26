export type HighlightColor = "yellow" | "green" | "pink" | "blue";

/** A single rectangle of a highlight, stored in PDF page coordinates at scale 1.0. */
export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface Highlight {
  id: string;
  docId: string;
  color: HighlightColor;
  rects: HighlightRect[];
  selectedText: string;
  note?: string;
  createdAt: string;
}

export interface StickyNote {
  id: string;
  docId: string;
  pageNumber: number;
  /** Normalized 0-1 position on the page (so it survives zoom). */
  x: number;
  y: number;
  content: string;
  color: HighlightColor;
  createdAt: string;
}

/** Map of highlight/note color name -> hex used for rendering. */
export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: "#FFE600",
  green: "#64C878",
  pink: "#E6649A",
  blue: "#508CF0",
};
