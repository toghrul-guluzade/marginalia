import PdfDocView from "./PdfDocView";
import TextDocView from "./TextDocView";
import type { LocalDoc } from "../../lib/localLibrary";

interface DocPaneProps {
  doc: LocalDoc;
  onRename: (title: string) => void;
}

/** Renders the right view for the active document based on its kind. */
export default function DocPane({ doc, onRename }: DocPaneProps) {
  if (doc.kind === "text") return <TextDocView doc={doc} onRename={onRename} />;
  return <PdfDocView doc={doc} onRename={onRename} />;
}
