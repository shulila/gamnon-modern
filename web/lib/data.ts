import "server-only";
import { readFileSync } from "fs";
import path from "path";
export * from "./constants";

// Data files live in web/data/ — colocated for Vercel deployment
const DATA = path.join(process.cwd(), "data");

function load<T>(filename: string): T {
  return JSON.parse(readFileSync(path.join(DATA, filename), "utf-8")) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

import type { Category, HebrewLetter } from "./constants";

export interface Page {
  url: string;
  slug: string;
  category: Category;
  letter?: HebrewLetter;
  title_he: string;
  body_he: string;
  images: { src: string; alt: string; width?: number; height?: number }[];
  internal_links: string[];
  content_hash: string;
}

export interface PageStub {
  slug: string;
  title_he: string;
  url: string;
  letter?: string;
  has_images: boolean;
}

export interface Taxonomy {
  [cat: string]: {
    count: number;
    pages: PageStub[];
    by_letter?: { [letter: string]: { label: string; count: number; pages: PageStub[] } };
  };
}

export interface SearchEntry {
  id: number;
  slug: string;
  url: string;
  title_he: string;
  body_he: string;
  category: Category;
  letter: string;
  has_images: boolean;
}

// ─── Data accessors (cached at module level) ──────────────────────────────────

let _pages: Page[] | null = null;
let _taxonomy: Taxonomy | null = null;
let _search: SearchEntry[] | null = null;
let _xrefs: Record<string, string[]> | null = null;

export function getPages(): Page[] {
  if (!_pages) _pages = load<Page[]>("pages.json");
  return _pages;
}

export function getTaxonomy(): Taxonomy {
  if (!_taxonomy) _taxonomy = load<Taxonomy>("taxonomy.json");
  return _taxonomy;
}

export function getSearchIndex(): SearchEntry[] {
  if (!_search) _search = load<SearchEntry[]>("search-index.json");
  return _search;
}

export function getCrossRefs(): Record<string, string[]> {
  if (!_xrefs) _xrefs = load<Record<string, string[]>>("crossrefs.json");
  return _xrefs;
}

// ─── Convenience ─────────────────────────────────────────────────────────────

export function getPagesByCategory(cat: Category): Page[] {
  return getPages().filter((p) => p.category === cat);
}

export function getPageBySlug(slug: string): Page | undefined {
  return getPages().find((p) => p.slug === slug);
}

export function pageUrlSlug(p: Page): string {
  const segs = p.slug.split("/");
  return segs[segs.length - 1].toLowerCase();
}

