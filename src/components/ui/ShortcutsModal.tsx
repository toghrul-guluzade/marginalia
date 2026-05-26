import { useEffect } from "react";
import { X } from "lucide-react";

const SHORTCUTS: Array<[string, string]> = [
  ["Select text", "Pick a color to highlight, or send the quote to a note"],
  ["S", "Toggle annotation sidebar"],
  ["Ctrl / Cmd + F", "Find text in document"],
  ["← / →", "Previous / next page"],
  ["Esc", "Close any popover or modal"],
  ["?", "Show this help"],
];

export default function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-ink-4 bg-ink-2 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl text-paper">Keyboard shortcuts</h2>
          <button className="rounded p-1 text-dim hover:bg-ink-3 hover:text-paper" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map(([key, desc]) => (
            <li key={key} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ghost">{desc}</span>
              <kbd className="shrink-0 rounded border border-ink-4 bg-ink-3 px-2 py-0.5 font-mono text-xs text-dim">
                {key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
