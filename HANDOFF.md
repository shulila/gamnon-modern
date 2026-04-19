# GAMNON MODERN — Project Handoff

**Date**: 2026-04-20  
**Status**: Phase 7 complete — ready for Vercel deploy

---

## What Was Built

A modern Hebrew static site reconstructing gamnon.net — an old herbal medicine encyclopedia
originally built with 1990s frameset HTML and Windows-1255 encoding.

- **1,294 content pages** — herbs, remedies, glossary, vitamins, minerals, recipes, gardening
- **1,322 static HTML files** generated at build time (Next.js 15 `output: "export"`)
- **RTL Hebrew UI** — `lang="he" dir="rtl"`, Heebo font, right-to-left layout
- **Full-text search** — client-side MiniSearch across all 1,294 entries
- **Responsive** — 2-column mobile → 4-column desktop grid

---

## Repository Structure

```
gamnon-modern/
├── scraper/            # Phase 1 — Python scraper (Playwright + BeautifulSoup)
│   └── pages.json      # 1,294 scraped pages (source of truth)
├── image-pipeline/     # Phase 2 — image metadata
│   ├── manifest.json   # 487 images with URL, alt, dimensions
│   ├── index.json      # Same + status: "metadata_only" (403 server block)
│   └── build.py        # Image downloader (use --metadata-only flag)
├── content/            # Phase 3 — processed content
│   ├── taxonomy.json   # Categories + Hebrew letter buckets
│   ├── search-index.json  # 1,294 MiniSearch entries
│   ├── crossrefs.json  # 21,545 resolved internal links
│   └── schema.ts       # Zod schemas
├── web/                # Phase 5 — Next.js 15 site
│   ├── app/            # App Router pages
│   ├── components/     # Nav, ContentBody, CategoryList
│   ├── lib/
│   │   ├── data.ts     # Server-only: reads JSON files with fs
│   │   └── constants.ts # Client-safe: types, LETTER_SLUG, CATEGORY_LABEL
│   ├── out/            # Static export (1,322 HTML files)
│   └── vercel.json     # Vercel build config
└── docs/
    └── PHASES.md       # Phase gate log
```

---

## Deploy to Vercel

### Option A — Vercel CLI (one-time)

```bash
cd gamnon-modern/web
npx vercel login          # Opens browser for auth
npx vercel --prod         # Deploys out/ to production
```

### Option B — GitHub Integration (recommended for auto-deploy)

1. Push `gamnon-modern/` to a GitHub repo
2. Go to vercel.com → New Project → Import that repo
3. Set **Root Directory** to `web/`
4. Framework preset: **Next.js** (auto-detected)
5. Deploy — every push to `main` redeploys automatically

### Option C — Static hosting anywhere

The `web/out/` folder is a complete static site with no server-side requirements.
Upload it to any static host: GitHub Pages, Cloudflare Pages, Netlify, S3+CloudFront, etc.

---

## Local Development

```bash
cd gamnon-modern/web
npm install
npm run dev       # http://localhost:3000 (dev server with HMR)
npm run build     # Regenerate web/out/ static export
```

---

## Content Update Workflow

If gamnon.net content changes:

```bash
# 1. Re-scrape
cd scraper && py -3 scraper.py

# 2. Rebuild content indexes
cd ../content && py -3 build.py

# 3. Rebuild Next.js static export
cd ../web && npm run build

# 4. Re-deploy (Vercel auto-deploys on git push, or run vercel --prod)
```

---

## Images — Known Issue

**Problem**: gamnon.net returns HTTP 403 for all image/binary requests (LiteSpeed server block).
The site falls back to displaying content without images.

**What exists**: `image-pipeline/manifest.json` — 487 images with original URLs, alt text, and
HTML-attribute dimensions (`width_hint`, `height_hint`).

**If images become available later**: run `py -3 image-pipeline/build.py` (without `--metadata-only`)
to download, convert to WebP/AVIF, and update `index.json`. The build script is ready.

---

## Visual Hebrew — Important Note

`body_he` text in `pages.json` is stored in **ISO-8859-8 visual order** (characters physically
left-to-right as they appear visually). This is different from standard logical Unicode Hebrew.

The CSS class `.body-visual-he` renders it correctly:
```css
direction: ltr;
text-align: right;
unicode-bidi: plaintext;
```

**Do not** change this to `direction: rtl` — that would reverse the text incorrectly.
`title_he` is standard logical Unicode Hebrew and renders with standard RTL rules.

---

## A11y Audit (Phase 7 Results)

| Check | Result |
|-------|--------|
| `lang="he" dir="rtl"` on `<html>` | ✅ |
| `<main id="main-content">` landmark | ✅ |
| `<nav>` landmark in header | ✅ |
| `<h1>` on every page | ✅ (all 1,294 checked) |
| Images with `alt` text | ✅ (pulled from original HTML) |
| Skip-to-main-content link | ✅ |
| Color contrast (WCAG AA) | ✅ (min 5.5:1) |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, `output: "export"`) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Font | Heebo (Google Fonts, Hebrew + Latin subsets) |
| Search | MiniSearch (client-side, prefix + fuzzy) |
| Validation | Zod schemas |
| Scraper | Python + Playwright + BeautifulSoup |
| Deploy | Vercel (static CDN) |
