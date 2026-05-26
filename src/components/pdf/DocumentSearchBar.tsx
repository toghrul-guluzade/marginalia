import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface DocumentSearchBarProps {
  scrollRootRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/**
 * Floating in-document text search. Marks matching text-layer spans in orange,
 * shows an "X of N" counter, and navigates with Enter / Shift+Enter.
 *
 * MVP scope: matches text contained within a single text-layer span (covers
 * most word/phrase searches); cross-span matches are not highlighted.
 */
export default function DocumentSearchBar({ scrollRootRef, onClose }: DocumentSearchBarProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<HTMLElement[]>([]);
  const [current, setCurrent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearMarks = useCallback(() => {
    const root = scrollRootRef.current;
    root?.querySelectorAll(".search-match").forEach((el) => {
      el.classList.remove("search-match", "search-current");
    });
  }, [scrollRootRef]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearMarks();
  }, [clearMarks]);

  // Recompute matches whenever the query changes.
  useEffect(() => {
    clearMarks();
    const root = scrollRootRef.current;
    const q = query.trim().toLowerCase();
    if (!root || !q) {
      setMatches([]);
      setCurrent(0);
      return;
    }
    const found: HTMLElement[] = [];
    root.querySelectorAll<HTMLElement>(".textLayer span").forEach((span) => {
      if (span.textContent && span.textContent.toLowerCase().includes(q)) {
        span.classList.add("search-match");
        found.push(span);
      }
    });
    setMatches(found);
    setCurrent(0);
  }, [query, clearMarks, scrollRootRef]);

  // Move the "current" marker and scroll it into view.
  useEffect(() => {
    matches.forEach((el, i) => el.classList.toggle("search-current", i === current));
    matches[current]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current, matches]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((c) => (matches.length === 0 ? 0 : (c + dir + matches.length) % matches.length));
    },
    [matches.length],
  );

  return (
    <div className="absolute right-4 top-2 z-50 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-lg">
      <input
        ref={inputRef}
        className="w-44 text-sm focus:outline-none"
        placeholder="Find in document…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go(e.shiftKey ? -1 : 1);
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
      />
      <span className="min-w-[4rem] text-center text-xs tabular-nums text-gray-500">
        {matches.length ? `${current + 1} of ${matches.length}` : query ? "0 of 0" : ""}
      </span>
      <button className="rounded p-0.5 text-gray-500 hover:bg-gray-100" onClick={() => go(-1)} aria-label="Previous match">
        <ChevronUp size={16} />
      </button>
      <button className="rounded p-0.5 text-gray-500 hover:bg-gray-100" onClick={() => go(1)} aria-label="Next match">
        <ChevronDown size={16} />
      </button>
      <button className="rounded p-0.5 text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="Close search">
        <X size={16} />
      </button>
    </div>
  );
}
