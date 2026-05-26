import { Quote } from "lucide-react";
import Menu, { MenuItem } from "../ui/Menu";
import type { LocalDoc } from "../../lib/localLibrary";

interface QuoteToNoteMenuProps {
  /** Non-null when there is a usable text selection in the PDF. */
  hasSelection: boolean;
  /** The project's notes (text docs) to send the quote into. */
  notes: LocalDoc[];
  /** noteId, or null to create a new note. */
  onQuote: (noteId: string | null) => void;
}

export default function QuoteToNoteMenu({ hasSelection, notes, onQuote }: QuoteToNoteMenuProps) {
  return (
    <Menu
      align="left"
      triggerLabel="Send selection to note"
      triggerClassName={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
        hasSelection ? "text-ghost hover:bg-ink-3 hover:text-paper" : "text-ink-5 hover:bg-ink-3"
      }`}
      trigger={
        <>
          <Quote size={15} />
          To note
        </>
      }
    >
      {(close) =>
        !hasSelection ? (
          <div className="px-3 py-2 text-xs text-ink-5">Select text in the PDF first</div>
        ) : (
          <>
            <div className="px-3 pt-1.5 pb-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-5">
              Send quote to
            </div>
            {notes.map((n) => (
              <MenuItem key={n.id} onClick={() => { close(); onQuote(n.id); }}>
                {n.title}
              </MenuItem>
            ))}
            {notes.length > 0 && <div className="my-1 h-px bg-rule" />}
            <MenuItem onClick={() => { close(); onQuote(null); }}>+ New note</MenuItem>
          </>
        )
      }
    </Menu>
  );
}
