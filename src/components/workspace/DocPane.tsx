import PdfDocView from "./PdfDocView";
import TextDocView from "./TextDocView";
import type { LocalDoc } from "../../lib/localLibrary";

interface DocPaneProps {
  doc: LocalDoc;
  /** All documents in the project (used to surface PDF annotations in notes). */
  docs: LocalDoc[];
  onRename: (title: string) => void;
}

/** Renders the right view for the active document based on its kind. */
export default function DocPane({ doc, docs, onRename }: DocPaneProps) {
  if (doc.kind === "text") {
    const pdfDocs = (docs ?? []).filter((d) => d.kind !== "text");
    return <TextDocView doc={doc} onRename={onRename} pdfDocs={pdfDocs} />;
  }
  return <PdfDocView doc={doc} onRename={onRename} />;
}
