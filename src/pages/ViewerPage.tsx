import PDFViewer from "../components/pdf/PDFViewer";

// Hardcoded test PDF for Sprint 1. Replaced by Supabase-backed docs in Sprint 4.
const TEST_PDF_URL =
  "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf";
const TEST_TITLE = "Trace-based Just-in-Time Type Specialization";

export default function ViewerPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="truncate text-base font-medium text-gray-800">{TEST_TITLE}</h1>
      </header>
      <main className="min-h-0 flex-1">
        <PDFViewer url={TEST_PDF_URL} />
      </main>
    </div>
  );
}
