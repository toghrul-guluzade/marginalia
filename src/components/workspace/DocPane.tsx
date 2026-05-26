import PdfDocView, { type QuotePayload } from "./PdfDocView";
import TextDocView from "./TextDocView";
import type { LocalDoc } from "../../lib/localLibrary";

interface DocPaneProps {
  doc: LocalDoc;
  /** All documents in the project (to surface PDF annotations in notes and vice versa). */
  docs: LocalDoc[];
  onRename: (title: string) => void;
  onQuoteToNote: (noteId: string | null, payload: QuotePayload) => void;
}

/** Renders the right view for the active document based on its kind. */
export default function DocPane({ doc, docs, onRename, onQuoteToNote }: DocPaneProps) {
  const all = docs ?? [];
  if (doc.kind === "text") {
    return <TextDocView doc={doc} onRename={onRename} pdfDocs={all.filter((d) => d.kind !== "text")} />;
  }
  return (
    <PdfDocView
      doc={doc}
      onRename={onRename}
      notes={all.filter((d) => d.kind === "text")}
      onQuoteToNote={onQuoteToNote}
    />
  );
}
