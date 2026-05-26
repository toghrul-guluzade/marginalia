import PdfDocView from "./PdfDocView";
import TextDocView from "./TextDocView";
import type { LocalDoc } from "../../lib/localLibrary";

/** Renders the right view for the active document based on its kind. */
export default function DocPane({ doc }: { doc: LocalDoc }) {
  if (doc.kind === "text") return <TextDocView doc={doc} />;
  return <PdfDocView doc={doc} />;
}
