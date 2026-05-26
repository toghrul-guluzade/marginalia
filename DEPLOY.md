# Deploying Research Studio

## 1. Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) — this creates
   the `documents` and `annotations` tables with Row Level Security and the private
   `pdfs` storage bucket (with per-user storage policies).
3. Copy your project URL and anon key.

## 2. Production build & deploy (Vercel)

Environment variables to set in the Vercel dashboard:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_BLOG_URL=https://yourblog.com   # optional — shows a "Back to blog" link
```

Then deploy:

```bash
npm install
npm run build      # tsc -b && vite build — fix any TS errors before deploying
```

- `vercel.json` rewrites all routes to `/index.html` (SPA) and sets a Content
  Security Policy allowing `self`, `blob:` (for PDF object URLs), and your Supabase
  project (`*.supabase.co`).
- The PDF.js worker is bundled into `dist` by Vite (imported via `?url`), so there is
  no "fake worker" fallback — no manual worker copy is required for pdfjs v5.
- Build output is split into `pdfjs`, `vendor` (React/Router), and app chunks.

### Supabase Auth settings

In Supabase → Authentication → URL Configuration, add your deployment URL to both:

- **Site URL**
- **Redirect URLs** (also add the iframe origin if embedding)

This makes email + Google OAuth redirects work from production.

## 3. Embed on your blog (optional)

**Option A — subdirectory.** Set `base: "/research/"` in `vite.config.ts`, deploy, and
have your blog reverse-proxy `/research/*` to the Vercel app.

**Option B — iframe.** Deploy to its own subdomain and embed:

```html
<iframe
  src="https://research.yoursite.com"
  style="width:100%;height:100vh;border:none;"
  allow="clipboard-write"
></iframe>
```

Add the iframe origin to the Supabase redirect URLs. The CSP `frame-ancestors` in
`vercel.json` is `'self'`; widen it to your blog origin if embedding cross-origin.

**Option C — standalone domain.** Point a custom domain at the Vercel deployment and
link to it from your blog navbar.

Set `VITE_BLOG_URL` so a "Back to blog" link appears in the top nav regardless of option.
