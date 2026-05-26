import { useEffect, useRef, useState } from "react";
import { tagColor } from "../../lib/tagColors";

interface AddTagDropdownProps {
  /** Tags already used across the library, for quick selection. */
  existingTags: string[];
  /** Tags already on this document (shown as disabled). */
  currentTags: string[];
  onAdd: (tag: string) => void;
  onClose: () => void;
}

/** Small dropdown to add a tag: pick an existing one or create a new tag. */
export default function AddTagDropdown({ existingTags, currentTags, onAdd, onClose }: AddTagDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [onClose]);

  const candidates = existingTags.filter(
    (t) => !currentTags.includes(t) && t.toLowerCase().includes(value.trim().toLowerCase()),
  );
  const canCreate = value.trim() && !existingTags.includes(value.trim());

  return (
    <div
      ref={ref}
      className="absolute right-0 z-20 mt-1 w-44 rounded border border-gray-200 bg-white p-2 text-sm shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        className="mb-2 w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand focus:outline-none"
        placeholder="Tag name…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value.trim());
            onClose();
          }
        }}
      />
      <ul className="max-h-40 overflow-auto">
        {canCreate && (
          <li>
            <button
              className="block w-full rounded px-2 py-1 text-left text-brand hover:bg-brand-light"
              onClick={() => { onAdd(value.trim()); onClose(); }}
            >
              Create “{value.trim()}”
            </button>
          </li>
        )}
        {candidates.map((tag) => {
          const c = tagColor(tag);
          return (
            <li key={tag}>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-50"
                onClick={() => { onAdd(tag); onClose(); }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.text }} />
                {tag}
              </button>
            </li>
          );
        })}
        {!canCreate && candidates.length === 0 && (
          <li className="px-2 py-1 text-gray-400">No tags</li>
        )}
      </ul>
    </div>
  );
}
