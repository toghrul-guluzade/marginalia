import PdfDocView from "./PdfDocView";
import TextDocView from "./TextDocView";
import type { LocalDoc } from "../../lib/localLibrary";

interface DocPaneProps {
  doc: LocalDoc;
  /** All documents in the project (notes can pull in the PDFs' annotations). */
  docs: LocalDoc[];
  onRename: (title: string) => void;
}

/** Renders the right view for the active document based on its kind. */
export default function DocPane({ doc, docs, onRename }: DocPaneProps) {
  const all = docs ?? [];
  if (doc.kind === "text") {
    return <TextDocView doc={doc} onRename={onRename} pdfDocs={all.filter((d) => d.kind !== "text")} />;
  }
  return <PdfDocView doc={doc} onRename={onRename} />;
}
