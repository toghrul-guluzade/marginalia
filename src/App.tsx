import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LibraryPage from "./pages/LibraryPage";
import ViewerPage from "./pages/ViewerPage";

// HashRouter so the SPA works at any base path (Vercel root + GitHub Pages subpath)
// with no server-side rewrites required.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/doc/:docId" element={<ViewerPage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </HashRouter>
  );
}
