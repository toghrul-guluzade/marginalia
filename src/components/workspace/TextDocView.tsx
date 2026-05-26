import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Link as LinkIcon,
  Download,
  Check,
  Loader2,
  Quote as QuoteIcon,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import EditableTitle from "../ui/EditableTitle";
import ProjectAnnotationsPanel, { type AnnotationRef } from "./ProjectAnnotationsPanel";
import { getTextContent, saveTextContent, type LocalDoc } from "../../lib/localLibrary";

// tiptap-markdown augments editor.storage at runtime but ships no types for it.
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
}

const tBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-dim hover:bg-ink-3 hover:text-paper transition-colors";
const tActive = "bg-ink-4 text-paper";

function Sep() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-rule" />;
}

export default function TextDocView({
  doc,
  onRename,
  pdfDocs,
}: {
  doc: LocalDoc;
  onRename: (title: string) => void;
  pdfDocs: LocalDoc[];
}) {
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [panelOpen, setPanelOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      Markdown.configure({ html: false }),
    ],
    // min-height fills most of the A4 sheet so the whole page is clickable to focus.
    editorProps: { attributes: { class: "tiptap min-h-[245mm]" } },
    onUpdate: ({ editor }) => {
      setSaveState("saving");
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const md = getMarkdown(editor);
        saveTextContent(doc.id, md).then(() => setSaveState("saved"));
      }, 600);
    },
  });

  // Load the document's markdown once the editor is ready.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    getTextContent(doc.id).then((md) => {
      if (cancelled) return;
      editor.commands.setContent(md || "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [editor, doc.id]);

  // Flush a pending save when leaving the document.
  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (editor && loaded) {
        saveTextContent(doc.id, getMarkdown(editor));
      }
    };
  }, [editor, doc.id, loaded]);

  function exportMarkdown() {
    if (!editor) return;
    const md = getMarkdown(editor);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^\w.-]+/g, "_") || "note"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function insertAnnotation(ref: AnnotationRef) {
    if (!editor) return;
    // tiptap-markdown parses inserted strings as Markdown.
    const quote = ref.text.split("\n").join(" ").trim();
    const noteLine = ref.note ? `\n${ref.note.trim()}\n` : "";
    const md = `\n> ${quote}\n${noteLine}\n*— ${ref.sourceTitle}, p.${ref.page}*\n\n`;
    editor.chain().focus().insertContent(md).run();
  }

  const words = editor
    ? editor.getText().trim().split(/\s+/).filter(Boolean).length
    : 0;

  function Btn({
    on,
    active,
    label,
    children,
  }: {
    on: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <button
        className={`${tBtn} ${active ? tActive : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={on}
        title={label}
        aria-label={label}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-rule bg-ink-2 px-3 py-1.5">
        {editor && (
          <>
            <Btn label="Bold (Ctrl+B)" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={16} />
            </Btn>
            <Btn label="Italic (Ctrl+I)" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={16} />
            </Btn>
            <Btn label="Strikethrough" active={editor.isActive("strike")} on={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough size={16} />
            </Btn>
            <Sep />
            <Btn label="Heading 1" active={editor.isActive("heading", { level: 1 })} on={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 size={16} />
            </Btn>
            <Btn label="Heading 2" active={editor.isActive("heading", { level: 2 })} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 size={16} />
            </Btn>
            <Btn label="Heading 3" active={editor.isActive("heading", { level: 3 })} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 size={16} />
            </Btn>
            <Sep />
            <Btn label="Bullet list" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={16} />
            </Btn>
            <Btn label="Numbered list" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={16} />
            </Btn>
            <Btn label="Quote" active={editor.isActive("blockquote")} on={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote size={16} />
            </Btn>
            <Btn label="Inline code" active={editor.isActive("code")} on={() => editor.chain().focus().toggleCode().run()}>
              <Code size={16} />
            </Btn>
            <Btn label="Code block" active={editor.isActive("codeBlock")} on={() => editor.chain().focus().toggleCodeBlock().run()}>
              <Code2 size={16} />
            </Btn>
            <Btn
              label="Link"
              active={editor.isActive("link")}
              on={() => {
                if (editor.isActive("link")) {
                  editor.chain().focus().unsetLink().run();
                  return;
                }
                const url = window.prompt("Link URL");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              <LinkIcon size={16} />
            </Btn>
          </>
        )}

        <div className="mx-2 flex flex-1 justify-center">
          <EditableTitle
            value={doc.title}
            onSave={onRename}
            className="max-w-full text-center font-serif text-sm italic text-paper"
          />
        </div>

        <span className="flex items-center gap-1 font-mono text-[10px] text-dim">
          {saveState === "saving" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} className="text-green-600" />}
          {words} words
        </span>
        <button className={tBtn} onClick={exportMarkdown} title="Download .md" aria-label="Download markdown">
          <Download size={16} />
        </button>
        <button
          className={`${tBtn} ${panelOpen ? tActive : ""}`}
          onClick={() => setPanelOpen((v) => !v)}
          title="Project annotations & references"
          aria-label="Toggle project annotations"
        >
          <QuoteIcon size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Editor page — A4 proportions (210 × 297mm) */}
        <div className="min-h-0 flex-1 overflow-auto bg-ink py-8">
          <div
            className="mx-auto rounded-sm bg-cream shadow-xl"
            style={{ width: "210mm", minHeight: "297mm", padding: "22mm 24mm" }}
          >
            {loaded ? (
              <EditorContent editor={editor} />
            ) : (
              <p className="text-ink-5">Loading…</p>
            )}
          </div>
        </div>

        <ProjectAnnotationsPanel
          pdfDocs={pdfDocs}
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          onInsert={insertAnnotation}
        />
      </div>
    </div>
  );
}
