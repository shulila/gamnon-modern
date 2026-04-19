import { z } from "zod";

// ─── Core content types ───────────────────────────────────────────────────────

export const CategorySchema = z.enum([
  "herb", "remedy", "glossary", "vitamin", "mineral",
  "recipe", "gardening", "panorama", "article",
]);
export type Category = z.infer<typeof CategorySchema>;

export const HebrewLetterSchema = z.enum([
  "א","ב","ג","ד","ה","ו","ז","ח","ט","י","כ","ל",
  "מ","נ","ס","ע","פ","צ","ק","ר","ש","ת","אגוזים",
]);
export type HebrewLetter = z.infer<typeof HebrewLetterSchema>;

// ─── Image ────────────────────────────────────────────────────────────────────

export const ImageRefSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type ImageRef = z.infer<typeof ImageRefSchema>;

export const ProcessedImageSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  alt_he: z.string(),
  width_hint: z.number().nullable(),
  height_hint: z.number().nullable(),
  found_on: z.string().url(),
  status: z.enum(["ok", "metadata_only", "error", "error_processing"]),
  width: z.number().nullable(),
  height: z.number().nullable(),
  webp_path: z.string().nullable(),
  avif_path: z.string().nullable(),
  placeholder: z.string().nullable(),
  needs_upscale: z.boolean().nullable(),
});
export type ProcessedImage = z.infer<typeof ProcessedImageSchema>;

// ─── Page (from scraper/clean/pages.json) ─────────────────────────────────────

export const PageSchema = z.object({
  url: z.string().url(),
  slug: z.string(),
  category: CategorySchema,
  letter: HebrewLetterSchema.optional(),
  title_he: z.string(),
  body_he: z.string(),
  images: z.array(ImageRefSchema),
  internal_links: z.array(z.string()),
  content_hash: z.string(),
  source_url: z.string().url(),
  last_fetched: z.string(),
});
export type Page = z.infer<typeof PageSchema>;

// ─── Taxonomy (content/taxonomy.json) ────────────────────────────────────────

export const PageStubSchema = z.object({
  slug: z.string(),
  title_he: z.string(),
  url: z.string().url(),
  letter: HebrewLetterSchema.optional(),
  has_images: z.boolean(),
});
export type PageStub = z.infer<typeof PageStubSchema>;

export const LetterBucketSchema = z.object({
  label: z.string(),
  count: z.number(),
  pages: z.array(PageStubSchema),
});

export const CategoryDataSchema = z.object({
  count: z.number(),
  pages: z.array(PageStubSchema),
  by_letter: z.record(HebrewLetterSchema, LetterBucketSchema).optional(),
});

export const TaxonomySchema = z.record(CategorySchema, CategoryDataSchema);
export type Taxonomy = z.infer<typeof TaxonomySchema>;

// ─── Search index (content/search-index.json) ────────────────────────────────

export const SearchEntrySchema = z.object({
  id: z.number(),
  slug: z.string(),
  url: z.string().url(),
  title_he: z.string(),
  body_he: z.string(),
  category: CategorySchema,
  letter: z.string(),
  has_images: z.boolean(),
});
export type SearchEntry = z.infer<typeof SearchEntrySchema>;

// ─── Cross-references (content/crossrefs.json) ───────────────────────────────

export type CrossRefs = Record<string, string[]>;
