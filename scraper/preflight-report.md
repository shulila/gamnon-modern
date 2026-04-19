# GAMNON MODERN — Pre-Flight Discovery Report
**Date:** 2026-04-19  
**Method:** Direct HTTP sampling (curl + Python) — Apify Cheerio failed, Playwright succeeded on first page only; scope counted via direct HTML parsing.

---

## 1. Site Structure (Confirmed)

The homepage is a `<frameset cols="80%, 20%">` with two frames:
- **Main content frame:** `AG-NewHerbal/GAmnon.html`
- **Navigation menu:** `AG-NewHerbal/Menu.html`

Navigation menu links to 8 top-level sections.

---

## 2. Page Count by Category

| Category | Pages | Notes |
|----------|-------|-------|
| **Herbs (א–ת)** | **486** | 22 Hebrew letter folders + Nuts |
| **Remedies** | **356** | By condition/symptom |
| **Glossary** | **293** | General terms |
| **Vitamins** | **50** | Vitamin entries |
| **Minerals** | **50** | Mineral entries |
| **Recipes** | **54** | Herbal preparations |
| **Gardening** | **44** | Growing guides |
| **Other/root** | **~20** | Homepage, prep guides |
| **TOTAL** | **~1,333** | |

### Herbs by Hebrew Letter

| Folder | Pages | | Folder | Pages |
|--------|-------|-|--------|-------|
| Herbs01-Alef (א) | 68 | | Herbs12-Lamed (ל) | 16 |
| Herbs02-Bet (ב) | 20 | | Herbs13-Mem (מ) | 29 |
| Herbs03-Gimel (ג) | 23 | | Herbs14-Nun (נ) | 4 |
| Herbs04-Dalet (ד) | 21 | | Herbs15-Samech (ס) | 26 |
| Herbs05-Hei (ה) | 6 | | Herbs16-Ayin (ע) | 31 |
| Herbs06-Vav (ו) | 8 | | Herbs17-Peh (פ) | 24 |
| Herbs07-Zayin (ז) | 9 | | Herbs18-Tzadi (צ) | 18 |
| Herbs08-Het (ח) | 26 | | Herbs19-Kof (ק) | 39 |
| Herbs09-Tet (ט) | 7 | | Herbs20-Reish (ר) | 15 |
| Herbs10-Yod (י) | 10 | | Herbs21-Shin (ש) | 26 |
| Herbs11-Kaf (כ) | 23 | | Herbs22-Tav (ת) | 27 |

---

## 3. Token Sampling (13 pages sampled)

| Page | Chars | ~Tokens |
|------|-------|---------|
| Aloe | 3,915 | 978 |
| Echinacea | 3,811 | 952 |
| Fenugreek | 3,512 | 878 |
| Sage | 2,827 | 706 |
| Chamomile | 5,464 | 1,366 |
| Garlic | 3,355 | 838 |
| Green Tea | 3,104 | 776 |
| Rosemary | 3,714 | 928 |
| Lavender | 4,134 | 1,033 |
| Flaxseed | 4,106 | 1,026 |
| Remedies List | 4,462 | 1,115 |
| Vitamins List | 4,356 | 1,089 |
| Minerals List | 1,358 | 339 |
| **Average** | **3,547** | **~924** |

**Total content tokens:** ~1,232,000  
**Total input to Claude** (content + ~500-token system prompt): **~1,898,000 tokens**  
**Total output** (~800 tokens/page): **~1,066,000 tokens**

---

## 4. Cost Projections

### Apify — Full Crawl
> ⚠️ Cheerio is INCOMPATIBLE with this site (frameset architecture). Must use `playwright:adaptive`.

| Item | Estimate |
|------|----------|
| Crawler type | `playwright:adaptive` (required) |
| Memory | 2,048 MB |
| Estimated runtime | ~30–60 min |
| Compute units | ~1–2 CU |
| **Estimated cost** | **$0.50–3.00** |
| Budget sufficient? | ✅ Free tier ($5) covers it |

### Anthropic — Translation (HE→EN)

| Tier | Input cost | Output cost | **Total** |
|------|-----------|-------------|---------|
| **Sonnet** (claude-sonnet-4-6) | $5.69 | $15.99 | **~$22** |
| **Sonnet + 5% QA with Opus** | $5.69 + $1.42 | $15.99 + $4.00 | **~$27** ← Recommended |
| **Full Opus** (claude-opus-4-7) | $28.47 | $79.98 | **~$108** |

> Prices: Sonnet = $3/$15 per 1M tokens; Opus = $15/$75 per 1M tokens.  
> "5% QA" = 67 random pages re-translated with Opus for quality comparison before committing to Sonnet for all.

---

## 5. Image Estimate

| Type | Per Page | Total |
|------|----------|-------|
| All `<img>` tags | ~51 | ~68,000 |
| **Content photos** (JPG/PNG) | ~10 | **~13,000** |
| GIF navigation/UI elements | ~48 | ~64,000 (skip) |
| Unique botanical photos (after dedup) | — | **est. 1,500–3,000** |

Most GIFs are navigation buttons and background tiles — will be discarded. Only JPG/PNG files will enter the image pipeline.

---

## 6. Structural Red Flags

| Issue | Severity | Plan |
|-------|----------|------|
| Frameset — Cheerio fails entirely | 🔴 High | Use `playwright:adaptive` + inject frame URLs as `startUrls` |
| ISO-8859-8 / Windows-1255 encoding | 🟡 Medium | `iconv-lite` decode in normalizer |
| Unquoted HTML attributes (`href=foo.htm`) | 🟡 Medium | BeautifulSoup / `html.parser` handles this |
| No `<html lang>` or `dir` attributes | 🟡 Medium | Will set `lang="he" dir="rtl"` in new site |
| Last modified: 2017 | 🟢 Low | Content is static, won't change during scrape |
| Some internal links use `target=` (frame refs) | 🟡 Medium | Strip `target` during normalization |

---

## 7. Summary & Recommendation

| Item | Value |
|------|-------|
| Total pages | ~1,333 |
| Total input tokens | ~1.9M |
| **Recommended translation** | Sonnet + 5% QA = **~$27** |
| **Apify full crawl** | **~$1–3** (free tier fine) |
| **Total estimated cost** | **~$28–30** |

> ⚠️ **Cost note:** Proceeding to Phase 1 will incur real Apify credits.  
> Proceeding to Phase 4 will incur real Anthropic API credits.  
> All other phases are local/free.

---

## 8. Awaiting Your Approvals

Before proceeding to Phase 1, please confirm:

**(a) Scope:** ~1,333 pages — acceptable?

**(b) Translation tier:**
- [ ] Sonnet only (~$22) — fastest, most cost-effective
- [x] **Sonnet + 5% Opus QA (~$27)** ← recommended
- [ ] Full Opus (~$108) — highest quality, not necessary

**(c) Budget ceiling:**
- Apify: current `.env.local` = $5 — sufficient
- Anthropic: current `.env.local` = $10 — needs to be raised to at least **$30** before Phase 4
