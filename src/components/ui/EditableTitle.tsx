import { useState } from "react";

interface EditableTitleProps {
  value: string;
  onSave: (next: string) => void;
  className?: string;
}

/** A title that switches to an inline input on click and saves on Enter/blur. */
export default function EditableTitle({ value, onSave, className = "" }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        className={`min-w-0 rounded border border-ink-4 bg-ink-3 px-1.5 py-0.5 text-paper focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          setEditing(false);
          const v = e.target.value.trim();
          if (v && v !== value) onSave(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <span
      className={`cursor-text truncate rounded px-1 hover:bg-ink-3/60 hover:underline hover:decoration-dotted hover:underline-offset-4 ${className}`}
      title="Click to rename"
      onClick={() => setEditing(true)}
    >
      {value}
    </span>
  );
}
