# Research Studio

A clean, fast, personal research tool you own. Organize work into **projects**, then
within each project: add PDFs and highlight / sticky-note them, and write **notes**
(.md / .txt) in a WYSIWYG editor. Multiple documents per project, switchable from the
left sidebar. No AI. No backend. No login — everything lives in your browser.

## Stack

- React + Vite + TypeScript
- PDF.js (`pdfjs-dist`) for rendering
- IndexedDB for PDF storage, localStorage for annotations (fully local)
- Tailwind CSS v4 for styling
- Zustand for state, react-router-dom (HashRouter) for routing

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

No environment variables are required. Optionally set `VITE_BLOG_URL` to show a
"Back to blog" link in the top nav.

## Routes

- `/` — document library (add PDFs, tag, search, sort)
- `/doc/:docId` — PDF viewer (`/doc/test` is a built-in demo document)

## Data & privacy

PDFs are stored in your browser's IndexedDB and annotations in localStorage, scoped to the
device and browser you use. Nothing is uploaded anywhere. Use the sidebar's **Export to
Markdown** to back up annotations.

## Deploying

Static site — deploys to Vercel or GitHub Pages with one build (relative base + HashRouter
run at any path). See [`DEPLOY.md`](DEPLOY.md).

Built from `Research_Studio_ClaudeCode_Spec.docx`, sprint by sprint, then converted to a
backend-free local app.
