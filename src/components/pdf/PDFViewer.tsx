import { usePDFDocument } from "../../hooks/usePDFDocument";
import PageCanvas from "./PageCanvas";

interface PDFViewerProps {
  /** A blob URL or remote URL to the PDF. */
  url: string;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-8" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full max-w-3xl aspect-[1/1.3] rounded bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg font-medium text-gray-800">Could not load this PDF</p>
      <p className="max-w-md text-sm text-gray-500">{error.message}</p>
    </div>
  );
}

/**
 * Renders a full PDF document as vertically stacked pages, each fit to width
 * at device-pixel-ratio quality.
 */
export default function PDFViewer({ url }: PDFViewerProps) {
  const { pdf, totalPages, isLoading, error } = usePDFDocument(url);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!pdf) return null;

  return (
    <div className="flex h-full justify-center overflow-auto bg-gray-100 py-4">
      <div className="flex w-full max-w-3xl flex-col gap-4 px-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <PageCanvas key={pageNumber} pdf={pdf} pageNumber={pageNumber} />
        ))}
      </div>
    </div>
  );
}
