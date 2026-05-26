# Projects + Dark Workspace — Design

Date: 2026-05-26

## Goal

Add a **Projects** layer above documents and a multi-document **workspace** that
matches `research-studio-mvp.html`: a left sidebar listing the project's documents
(click to switch), a center PDF viewer, and the right annotations panel. Dark theme.
Fully local (IndexedDB), no auth, no backend.

## Decisions

- Navigation: **Projects home → open → workspace**.
- Visual style: **adopt the reference's dark theme** (ink palette, Instrument Serif + Geist).
- Document model: **one project per document**.

## Data model (IndexedDB)

- New store `projects`: `{ id, name, created_at }`.
- `documents` gains `project_id: string`.
- DB version bump (v2). On upgrade / first load, any document missing `project_id`
  is migrated into an auto-created "My Documents" project.
- Deleting a project cascades: remove its documents, their stored blobs, cached
  thumbnails, and their annotations (highlights + sticky notes).
- Deleting a document also clears its cached thumbnail and annotations.

`localLibrary` API additions: `listProjects`, `createProject`, `renameProject`,
`deleteProject`; `listDocuments(projectId)`; `addDocument(file, { title, pageCount, projectId })`.

## Routes (HashRouter)

- `/` → `ProjectsHome` — project cards (name, doc count, last-used); create / rename / delete.
- `/project/:projectId/:docId?` → `ProjectWorkspace` — 3-pane layout. `:docId` keeps the
  open document across refresh; default to the project's first document.

The old all-documents grid (`LibraryPage`) and standalone `/doc/test` route are removed.

## Workspace (3 panes)

- **Left `DocSidebar`**: brand + "← Projects" link; project's document list (PDF icon,
  name, "N pages · size", annotation-count badge, active highlight); Upload button at bottom.
- **Center**: existing `PDFToolbar` + `PDFViewer` (PDF.js, highlights, notes, selection,
  in-doc search, shortcuts, reading prefs) — reused, restyled dark.
- **Right**: existing `AnnotationSidebar` (search / filter / export), toggled with `S`.

## Theme

Reference tokens as CSS variables / Tailwind theme: ink palette
(`#0f0e0d`…`#56524c`), paper/cream, highlight colors. Fonts: Instrument Serif (titles),
Geist (UI), Geist Mono (labels) via Google Fonts. PDF pages stay light (cream) on a dark
surround. Restyle: toolbar, both sidebars, popovers, highlight tooltip, cards, toasts.

## Reuse / unchanged

- PDF rendering engine, three-layer page, coordinate mapping.
- `annotationStore` keyed by `docId` — unchanged.
- Highlight/note/quick-note/search/shortcut/reading-pref logic.

## Build phases (each committed)

1. Data model: projects in IndexedDB + `project_id` + migration.
2. `ProjectsHome` page.
3. `ProjectWorkspace` shell + `DocSidebar`; integrate viewer + annotations.
4. Dark theme restyle (fonts + tokens + components).
5. Routing cleanup; remove old library grid / demo route.

## Out of scope (for now)

Sharing documents across projects; project-level tags/colors; collaboration; cloud sync.
