import Link from "next/link";
import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";

const CATEGORY_ICONS: Record<string, string> = {
  herb: "🌿", remedy: "💊", glossary: "📖", vitamin: "🌟",
  mineral: "💎", recipe: "🍵", gardening: "🌱", panorama: "🏔️",
};

const CATEGORY_HREFS: Record<string, string> = {
  herb: "/herbs", remedy: "/remedies", glossary: "/glossary",
  vitamin: "/vitamins", mineral: "/minerals", recipe: "/recipes",
  gardening: "/gardening",
};

export default function HomePage() {
  const taxonomy = getTaxonomy();
  const totalEntries = Object.values(taxonomy).reduce((s, c) => s + c.count, 0);

  const cats = Object.entries(taxonomy)
    .filter(([cat]) => CATEGORY_HREFS[cat])
    .sort(([, a], [, b]) => b.count - a.count);

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="text-center py-16 mb-4">
        <div className="text-6xl mb-4">🌿</div>
        <h1 className="text-5xl font-bold mb-4" style={{ color: "var(--color-herb)" }}>
          גאמנון
        </h1>
        <p className="text-xl mb-2" style={{ color: "var(--color-text)" }}>
          אנציקלופדיה של צמחי מרפא, תרופות טבעיות, ויטמינים ומינרלים
        </p>
        <p className="text-base" style={{ color: "var(--color-muted)" }}>
          {totalEntries.toLocaleString()} ערכים בעברית
        </p>
      </section>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {cats.map(([cat, data]) => (
          <Link key={cat} href={CATEGORY_HREFS[cat]}
            className="rounded-xl p-5 text-right block"
            style={{
              background: "#fff",
              border: "1px solid var(--color-border)",
              textDecoration: "none",
              color: "inherit",
              transition: "box-shadow 0.15s, transform 0.15s",
            }}
            onMouseEnter={undefined}
          >
            <div className="text-3xl mb-3">{CATEGORY_ICONS[cat] ?? "📄"}</div>
            <div className="font-bold text-lg leading-tight mb-1" style={{ color: "var(--color-herb)" }}>
              {CATEGORY_LABEL[cat]}
            </div>
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>
              {data.count.toLocaleString()} ערכים
            </div>
          </Link>
        ))}
      </div>

      {/* Search CTA */}
      <section className="rounded-xl p-8 text-center mb-12"
        style={{ background: "var(--color-herb-light)", border: "1px solid var(--color-border)" }}>
        <p className="text-lg mb-3" style={{ color: "var(--color-text)" }}>
          מחפשים צמח, מחלה, ויטמין או מינרל?
        </p>
        <Link href="/search"
          className="inline-block rounded-lg px-6 py-3 font-bold text-base"
          style={{ background: "var(--color-herb)", color: "#fff", textDecoration: "none" }}>
          🔍 חיפוש בכל האנציקלופדיה
        </Link>
      </section>
    </div>
  );
}
