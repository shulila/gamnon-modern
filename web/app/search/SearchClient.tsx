"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SearchEntry } from "@/lib/constants";
import { LETTER_SLUG } from "@/lib/constants";

const CAT_HREF: Record<string, (e: SearchEntry) => string> = {
  herb: (e) => `/herbs/${LETTER_SLUG[e.letter] ?? "alef"}/${e.slug.split("/").pop()!.toLowerCase()}`,
  remedy: (e) => `/remedies/${e.slug.split("/").pop()!.toLowerCase()}`,
  glossary: (e) => `/glossary/${e.slug.split("/").pop()!.toLowerCase()}`,
  vitamin: (e) => `/vitamins/${e.slug.split("/").pop()!.toLowerCase()}`,
  mineral: (e) => `/minerals/${e.slug.split("/").pop()!.toLowerCase()}`,
  recipe: (e) => `/recipes/${e.slug.split("/").pop()!.toLowerCase()}`,
  gardening: (e) => `/gardening/${e.slug.split("/").pop()!.toLowerCase()}`,
};

const CAT_LABEL: Record<string, string> = {
  herb: "צמח", remedy: "מרפא", glossary: "מילון",
  vitamin: "ויטמין", mineral: "מינרל", recipe: "מתכון", gardening: "גינון",
};

export default function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const miniRef = useRef<import("minisearch").default | null>(null);

  useEffect(() => {
    import("minisearch").then(({ default: MiniSearch }) => {
      const ms = new MiniSearch<SearchEntry>({
        fields: ["title_he", "body_he"],
        storeFields: ["id", "slug", "title_he", "category", "letter", "url"],
        searchOptions: { prefix: true, fuzzy: 0.2 },
      });
      ms.addAll(entries);
      miniRef.current = ms;
    });
  }, [entries]);

  useEffect(() => {
    if (!query.trim() || !miniRef.current) {
      setResults([]);
      return;
    }
    const hits = miniRef.current.search(query).slice(0, 30);
    const byId = new Map(entries.map((e) => [e.id, e]));
    setResults(hits.map((h) => byId.get(h.id)!).filter(Boolean));
  }, [query, entries]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-right" style={{ color: "var(--color-herb)" }}>
        🔍 חיפוש
      </h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חפש צמח, מחלה, ויטמין..."
        dir="rtl"
        className="w-full rounded-lg px-4 py-3 text-right text-base mb-6"
        style={{
          border: "2px solid var(--color-herb)", outline: "none",
          background: "#fff", color: "var(--color-text)",
        }}
      />

      {query && results.length === 0 && (
        <p className="text-right" style={{ color: "var(--color-muted)" }}>לא נמצאו תוצאות עבור "{query}"</p>
      )}

      <ul className="grid gap-2">
        {results.map((r) => {
          const href = CAT_HREF[r.category]?.(r) ?? r.url;
          return (
            <li key={r.id}>
              <Link href={href}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:shadow"
                style={{ background: "#fff", border: "1px solid var(--color-border)", textDecoration: "none" }}>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--color-herb-light)", color: "var(--color-herb)" }}>
                  {CAT_LABEL[r.category] ?? r.category}
                </span>
                <span className="font-medium" dir="rtl" style={{ color: "var(--color-text)" }}>
                  {r.title_he}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
