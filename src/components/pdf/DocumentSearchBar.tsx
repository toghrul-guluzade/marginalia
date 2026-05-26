import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface DocumentSearchBarProps {
  scrollRootRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Floating in-document text search. Wraps each matched substring (not the whole
 * line) in an orange mark, shows an "X of N" counter, navigates with Enter /
 * Shift+Enter.
 *
 * Scope: matches text within a single text-layer span (covers most word/phrase
 * searches); matches that straddle two spans are not highlighted.
 */
export default function DocumentSearchBar({ scrollRootRef, onClose }: DocumentSearchBarProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<HTMLElement[]>([]);
  const [current, setCurrent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Spans whose innerHTML we replaced, with their original text, to restore later.
  const modified = useRef<Array<{ span: HTMLElement; text: string }>>([]);

  const clearMarks = useCallback(() => {
    modified.current.forEach(({ span, text }) => {
      span.textContent = text;
    });
    modified.current = [];
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearMarks();
  }, [clearMarks]);

  // Recompute matches whenever the query changes.
  useEffect(() => {
    clearMarks();
    const root = scrollRootRef.current;
    const q = query.trim();
    if (!root || !q) {
      setMatches([]);
      setCurrent(0);
      return;
    }
    const ql = q.toLowerCase();
    root.querySelectorAll<HTMLElement>(".textLayer span").forEach((span) => {
      // Only leaf text spans; skip containers (and our own injected marks).
      if (span.children.length > 0) return;
      const text = span.textContent ?? "";
      const lower = text.toLowerCase();
      if (!lower.includes(ql)) return;

      modified.current.push({ span, text });
      let html = "";
      let i = 0;
      for (let idx = lower.indexOf(ql, i); idx !== -1; idx = lower.indexOf(ql, i)) {
        html += escapeHtml(text.slice(i, idx));
        html += `<span class="search-mark">${escapeHtml(text.slice(idx, idx + q.length))}</span>`;
        i = idx + q.length;
      }
      html += escapeHtml(text.slice(i));
      span.innerHTML = html;
    });

    setMatches(Array.from(root.querySelectorAll<HTMLElement>(".search-mark")));
    setCurrent(0);
  }, [query, clearMarks, scrollRootRef]);

  // Move the "current" marker and scroll it into view.
  useEffect(() => {
    matches.forEach((el, i) => el.classList.toggle("current", i === current));
    matches[current]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current, matches]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((c) => (matches.length === 0 ? 0 : (c + dir + matches.length) % matches.length));
    },
    [matches.length],
  );

  return (
    <div className="absolute right-4 top-2 z-50 flex items-center gap-2 rounded-lg border border-ink-4 bg-ink-2 px-2 py-1.5 shadow-xl">
      <input
        ref={inputRef}
        className="w-44 bg-transparent text-sm text-paper placeholder:text-ink-5 focus:outline-none"
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
      <span className="min-w-[4rem] text-center font-mono text-[11px] tabular-nums text-dim">
        {matches.length ? `${current + 1} of ${matches.length}` : query ? "0 of 0" : ""}
      </span>
      <button className="rounded p-0.5 text-dim hover:bg-ink-3 hover:text-paper" onClick={() => go(-1)} aria-label="Previous match">
        <ChevronUp size={16} />
      </button>
      <button className="rounded p-0.5 text-dim hover:bg-ink-3 hover:text-paper" onClick={() => go(1)} aria-label="Next match">
        <ChevronDown size={16} />
      </button>
      <button className="rounded p-0.5 text-dim hover:bg-ink-3 hover:text-paper" onClick={onClose} aria-label="Close search">
        <X size={16} />
      </button>
    </div>
  );
}
