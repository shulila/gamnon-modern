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

  const cats = Object.entries(taxonomy)
    .filter(([cat]) => CATEGORY_HREFS[cat])
    .sort(([, a], [, b]) => b.count - a.count);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--color-herb)" }}>
          גאמנון
        </h1>
        <p className="text-lg" style={{ color: "var(--color-muted)" }}>
          אנציקלופדיה מקיפה של צמחי מרפא, תרופות טבעיות, ויטמינים ומינרלים
        </p>
        <p className="text-base mt-1" style={{ color: "var(--color-muted)" }}>
          {Object.values(taxonomy).reduce((s, c) => s + c.count, 0).toLocaleString()} ערכים
        </p>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cats.map(([cat, data]) => (
          <Link key={cat} href={CATEGORY_HREFS[cat]}
            className="rounded-xl p-5 text-right transition-transform hover:scale-[1.02] hover:shadow-md"
            style={{ background: "#fff", border: "1px solid var(--color-border)", textDecoration: "none", color: "inherit" }}>
            <div className="text-3xl mb-2">{CATEGORY_ICONS[cat] ?? "📄"}</div>
            <div className="font-bold text-base" style={{ color: "var(--color-herb)" }}>
              {CATEGORY_LABEL[cat]}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
              {data.count} ערכים
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-12 p-6 rounded-xl text-center" style={{ background: "var(--color-herb-light)" }}>
        <Link href="/search" className="text-lg font-medium" style={{ color: "var(--color-herb)" }}>
          🔍 חיפוש בכל האנציקלופדיה
        </Link>
      </section>
    </div>
  );
}
