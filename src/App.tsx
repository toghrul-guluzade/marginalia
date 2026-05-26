import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LibraryPage from "./pages/LibraryPage";
import ViewerPage from "./pages/ViewerPage";
import AuthPage from "./pages/AuthPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/doc/:docId" element={<ViewerPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}
