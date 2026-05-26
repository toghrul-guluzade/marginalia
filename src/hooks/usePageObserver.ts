import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * Tracks which page is currently most visible within a scroll container,
 * using an IntersectionObserver over elements tagged with data-page-number.
 */
export function usePageObserver(
  rootRef: RefObject<HTMLElement | null>,
  totalPages: number,
): number {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || totalPages === 0) return;

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number(
            (entry.target as HTMLElement).dataset.pageNumber ?? 0,
          );
          ratios.set(page, entry.intersectionRatio);
        }
        let best = 1;
        let bestRatio = -1;
        for (const [page, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = page;
          }
        }
        if (bestRatio > 0) setCurrentPage(best);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    const elements = root.querySelectorAll<HTMLElement>("[data-page-number]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootRef, totalPages]);

  return currentPage;
}
