import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface QuickNoteEditorProps {
  /** Viewport coordinates of the selection's top-center. */
  anchor: { x: number; y: number };
  onSave: (text: string) => void;
  /** Discard the note (the highlight is kept). */
  onCancel: () => void;
}

const WIDTH = 200;

/**
 * Small floating textarea shown right after a quick-add highlight.
 * Enter or Cmd+Enter saves; Escape discards the note (keeps the highlight).
 */
export default function QuickNoteEditor({ anchor, onSave, onCancel }: QuickNoteEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [pos, setPos] = useState({ left: anchor.x, top: anchor.y });

  useLayoutEffect(() => {
    const margin = 8;
    let left = anchor.x - WIDTH / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - WIDTH - margin));
    setPos({ left, top: anchor.y + margin + 12 });
  }, [anchor]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <textarea
      ref={ref}
      className="fixed z-50 resize-none rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg focus:border-brand focus:outline-none"
      style={{ left: pos.left, top: pos.top, width: WIDTH }}
      rows={2}
      placeholder="Add a note… (Enter to save)"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSave(text.trim());
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={() => onSave(text.trim())}
    />
  );
}
