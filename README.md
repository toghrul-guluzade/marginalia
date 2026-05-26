# Research Studio

A clean, fast, personal research tool you own. Upload PDFs, read them, highlight
text in multiple colors, leave sticky notes, organize documents in a library, and
export your annotations. No AI. No backend processing — just an annotation-only MVP.

## Stack

- React + Vite + TypeScript
- PDF.js (`pdfjs-dist`) for rendering
- Supabase for auth, database, and storage
- Tailwind CSS v4 for styling
- Zustand for state, react-router-dom for routing

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
```

Copy `.env.local` and fill in your Supabase project URL and anon key:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Routes

- `/` — document library
- `/doc/:docId` — PDF viewer
- `/auth` — login / signup

Built from `Research_Studio_ClaudeCode_Spec.docx`, sprint by sprint.
