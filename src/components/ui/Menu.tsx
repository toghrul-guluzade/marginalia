import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface MenuProps {
  /** Trigger button contents (e.g. an icon). */
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}

/** A small click-to-open dropdown menu with outside-click / Escape dismissal. */
export default function Menu({ trigger, triggerClassName, triggerLabel, align = "right", children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={triggerClassName}
        aria-label={triggerLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute z-30 mt-1 min-w-40 overflow-hidden rounded-lg border border-ink-4 bg-ink-2 py-1 text-sm shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`block w-full px-3 py-1.5 text-left hover:bg-ink-3 ${
        danger ? "text-red-400 hover:bg-red-500/10" : "text-ghost"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
