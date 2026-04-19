# GAMNON MODERN — Phase Gate Log

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| 0 | Environment setup | ✅ Done | 2026-04 |
| 0.5 | Pre-flight discovery | ✅ Done | 2026-04 |
| 1 | Full scrape — 1,294 pages, Python scraper | ✅ Done | 2026-04 |
| 2 | Image pipeline — 487 images, metadata index | ✅ Done (see note) | 2026-04-19 |
| 3 | Content structure & taxonomy | — | |
| 4 | Translation pipeline | ⏭ Deferred | |
| 5 | Next.js 15 site | — | |
| 6 | Design quality pass | — | |
| 7 | Validation | — | |
| 8 | Deploy | — | |

## Phase 2 — Image Pipeline Notes

**Status**: Metadata collected; actual image files not downloaded.

**Root cause**: gamnon.net server returns HTTP 403 for all image/binary file requests
(`.jpg`, `.png`, `.gif`) regardless of User-Agent, Referer, or cookies — even when
loaded by Playwright acting as a real browser. This is a LiteSpeed server-side block,
not a hotlink protection. HTML pages return 200 normally.

**What was produced**:
- `image-pipeline/manifest.json` — 487 unique images with URL, filename, alt, dimensions, found_on page
- `image-pipeline/index.json` — Same data with `status: "metadata_only"` and `webp_path: null`
- All 487 images have HTML-attribute dimensions (`width_hint`, `height_hint`)
- Distribution: Herbs 323, Remedies 81, Glossary 40, Panorama 19, Gardening 12, Recipes 8

**Impact on Phase 5 (Next.js site)**:
- Image components will load from the original gamnon.net URL with an `onError` fallback
- Fallback: botanical SVG placeholder (leaf icon) sized to match `width_hint × height_hint`
- If the server lifts restrictions later, running `py -3 build.py` without `--metadata-only`
  will download, convert to WebP/AVIF, and update the index automatically (build.py is ready)

**Alternative sources to investigate**:
- Google Images / Bing cached versions (manual)
- Internet Archive (CDX search returned 0 results for gamnon.net images)
