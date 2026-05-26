import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProjectsHome from "./pages/ProjectsHome";
import ProjectWorkspace from "./pages/ProjectWorkspace";

// HashRouter so the SPA works at any base path (Vercel root + GitHub Pages subpath)
// with no server-side rewrites required.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProjectsHome />} />
        <Route path="/project/:projectId/:docId?" element={<ProjectWorkspace />} />
      </Routes>
      <Toaster position="bottom-center" toastOptions={{ style: { background: "#1c1a18", color: "#b5b0a8", border: "1px solid #3d3a35" } }} />
    </HashRouter>
  );
}
