import { readFileSync, writeFileSync } from "fs";
import * as cheerio from "cheerio";
import { createHash } from "crypto";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const ImageRefSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const PageSchema = z.object({
  url: z.string(),
  slug: z.string(),
  category: z.enum(["herb", "remedy", "glossary", "vitamin", "mineral", "recipe", "gardening", "panorama", "article"]),
  letter: z.string().optional(),
  title_he: z.string(),
  body_he: z.string(),
  images: z.array(ImageRefSchema),
  internal_links: z.array(z.string()),
  content_hash: z.string(),
  source_url: z.string(),
  last_fetched: z.string(),
});

type Page = z.infer<typeof PageSchema>;

// ─── URL → Category + Letter ──────────────────────────────────────────────────

const LETTER_MAP: Record<string, string> = {
  "Herbs01-Alef": "א", "Herbs02-Bet": "ב", "Herbs03-Gimal": "ג",
  "Herbs04-Dalet": "ד", "Herbs05-Hei": "ה", "Herbs06-Vav": "ו",
  "Herbs07-Zayin": "ז", "Herbs08-Het": "ח", "Herbs09-Tet": "ט",
  "Herbs10-Yod": "י", "Herbs11-Kaf": "כ", "Herbs12-Lamed": "ל",
  "Herbs13-Mem": "מ", "Herbs14-Nun": "נ", "Herbs15-Samech": "ס",
  "Herbs16-Ayin": "ע", "Herbs17-Peh": "פ", "Herbs18-Zadei": "צ",
  "Herbs19-Kof": "ק", "Herbs20-Reish": "ר", "Herbs21-Shin": "ש",
  "Herbs22-Tav": "ת", "Herbs23-Nuts": "אגוזים",
};

function categorize(url: string): { category: Page["category"]; letter?: string } {
  const path = url.replace("https://www.gamnon.net/AG-NewHerbal/", "");
  for (const [folder, letter] of Object.entries(LETTER_MAP)) {
    if (path.startsWith(folder + "/")) return { category: "herb", letter };
  }
  if (path.startsWith("REMEDIEs/")) return { category: "remedy" };
  if (path.startsWith("Glossary/Vitamins/")) return { category: "vitamin" };
  if (path.startsWith("Glossary/Minerals/")) return { category: "mineral" };
  if (path.startsWith("Glossary/")) return { category: "glossary" };
  if (path.startsWith("RECIPEs/")) return { category: "recipe" };
  if (path.startsWith("_Gardening/")) return { category: "gardening" };
  if (path.startsWith("Panorama/")) return { category: "panorama" };
  return { category: "article" };
}

function slugify(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/\.html?$/i, "")
    .replace(/[^a-zA-Z0-9\u0590-\u05FF/_-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

// ─── HTML Extraction ──────────────────────────────────────────────────────────

function extractPage(raw: { url: string; html?: string; markdown?: string; metadata?: { title?: string }; crawl?: { loadedTime?: string } }): Page | null {
  if (!raw.html && !raw.markdown) return null;

  const html = raw.html ?? "";
  const $ = cheerio.load(html, { decodeEntities: true });

  // Remove junk: scripts, styles, frame fallbacks, nav images
  $("script, style, noscript, noframes, head").remove();
  $('font[face="Globes"]').each((_, el) => {
    // keep text, remove font wrapper
    $(el).replaceWith($(el).html() ?? "");
  });

  // Title: prefer <title> or first heading
  const title_he = (
    raw.metadata?.title ??
    $("title").text() ??
    $("h1,h2,h3").first().text()
  ).trim().replace(/\s+/g, " ");

  // Body: clean text, strip HTML boilerplate
  const body_he = $("body")
    .text()
    .replace(/Your browser does not support frames[!]?/gi, "")
    .replace(/\s{3,}/g, "\n\n")
    .trim();

  if (body_he.length < 50) return null; // skip near-empty pages

  // Images — only JPG/PNG content images, skip GIF buttons
  const images: Page["images"] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (!/\.(jpe?g|png)$/i.test(src)) return;
    const alt = ($(el).attr("alt") ?? "").trim();
    const w = parseInt($(el).attr("width") ?? "0");
    const h = parseInt($(el).attr("height") ?? "0");
    images.push({ src, alt, ...(w ? { width: w } : {}), ...(h ? { height: h } : {}) });
  });

  // Internal links (same domain)
  const internal_links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href.startsWith("http") || href.includes("gamnon.net")) {
      internal_links.push(href);
    }
  });

  const content_hash = createHash("md5").update(body_he).digest("hex");
  const { category, letter } = categorize(raw.url);

  return PageSchema.parse({
    url: raw.url,
    slug: slugify(raw.url),
    category,
    ...(letter ? { letter } : {}),
    title_he,
    body_he,
    images,
    internal_links: [...new Set(internal_links)],
    content_hash,
    source_url: raw.url,
    last_fetched: raw.crawl?.loadedTime ?? new Date().toISOString(),
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const INPUT_PATH = process.argv[2] ?? "raw/dataset.json";
const OUTPUT_PATH = "clean/pages.json";

console.log(`Reading ${INPUT_PATH}…`);
const raw = JSON.parse(readFileSync(INPUT_PATH, "utf-8")) as unknown[];
console.log(`  ${raw.length} raw items`);

const seen = new Set<string>();
const pages: Page[] = [];
let skipped_empty = 0;
let skipped_dup = 0;

for (const item of raw) {
  const page = extractPage(item as Parameters<typeof extractPage>[0]);
  if (!page) { skipped_empty++; continue; }
  if (seen.has(page.content_hash)) { skipped_dup++; continue; }
  seen.add(page.content_hash);
  pages.push(page);
}

// Stats
const by_cat: Record<string, number> = {};
for (const p of pages) by_cat[p.category] = (by_cat[p.category] ?? 0) + 1;

console.log(`\n✅ Normalized ${pages.length} pages`);
console.log(`   Skipped empty: ${skipped_empty}, duplicates: ${skipped_dup}`);
console.log("\nBy category:");
for (const [cat, n] of Object.entries(by_cat).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${n}`);
}

writeFileSync(OUTPUT_PATH, JSON.stringify(pages, null, 2), "utf-8");
console.log(`\nWrote → ${OUTPUT_PATH}`);
