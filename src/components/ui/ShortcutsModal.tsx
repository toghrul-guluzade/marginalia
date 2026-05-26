import { useEffect } from "react";
import { X } from "lucide-react";

const SHORTCUTS: Array<[string, string]> = [
  ["H", "Toggle highlight mode (select text to highlight)"],
  ["N", "Toggle note mode (click to place a note)"],
  ["S", "Toggle annotation sidebar"],
  ["Ctrl / Cmd + F", "Find text in document"],
  ["Ctrl / Cmd + [", "Previous document"],
  ["Ctrl / Cmd + ]", "Next document"],
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Keyboard shortcuts</h2>
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map(([key, desc]) => (
            <li key={key} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600">{desc}</span>
              <kbd className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-xs text-gray-700">
                {key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
