# Deploying Research Studio

Research Studio is a **fully client-side, offline-capable** app — no backend, no login.
PDFs are stored in your browser's IndexedDB and annotations in localStorage, all on the
device you use. That means it deploys as a plain static site anywhere.

`base: "./"` (relative asset paths) + `HashRouter` mean **one build runs at any path** —
a root domain (Vercel) or a repo subpath (GitHub Pages) — with no per-target rebuild and
no server-side rewrites.

```bash
npm install
npm run build     # tsc -b && vite build -> dist/
npm run preview   # serve dist/ locally to check the production build
```

Optional env var (build time): `VITE_BLOG_URL` shows a "Back to blog" link in the top nav.

## Vercel

1. Import the repo in Vercel (framework preset: Vite).
2. Build command `npm run build`, output directory `dist`.
3. Optionally set `VITE_BLOG_URL` in Project → Settings → Environment Variables.

`vercel.json` adds a Content Security Policy that allows `self` and `blob:` (PDF object
URLs). No `connect-src` to any backend is needed.

## GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`:

1. Repo → Settings → Pages → **Build and deployment → Source: GitHub Actions**.
2. (Optional) Repo → Settings → Secrets and variables → Actions → **Variables** →
   add `VITE_BLOG_URL`.
3. Push to `main`. The workflow builds and publishes `dist/` to Pages.

The site is served at `https://<user>.github.io/<repo>/`; the relative base + HashRouter
handle the subpath automatically.

## Notes

- The PDF.js worker is bundled into `dist` by Vite (imported via `?url`), so there is no
  "fake worker" fallback and nothing to copy manually.
- Data is per-browser. Use the sidebar **Export to Markdown** to back up annotations; PDFs
  live in IndexedDB on the device that added them.
