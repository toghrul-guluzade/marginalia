import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
// Vite resolves this to a hashed URL and bundles the worker.
// Sprint 6 switches this to the statically-copied "/pdf.worker.min.js".
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface UsePDFDocumentResult {
  pdf: PDFDocumentProxy | null;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Load a PDF document from a blob URL or remote URL.
 * Returns the document proxy plus loading/error state.
 */
export function usePDFDocument(url: string | null): UsePDFDocumentResult {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setPdf(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let loadedDoc: PDFDocumentProxy | null = null;

    setIsLoading(true);
    setError(null);
    setPdf(null);

    const task = pdfjsLib.getDocument(url);
    task.promise.then(
      (doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        loadedDoc = doc;
        setPdf(doc);
        setIsLoading(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
      task.destroy();
      loadedDoc?.destroy();
    };
  }, [url]);

  return { pdf, totalPages: pdf?.numPages ?? 0, isLoading, error };
}
