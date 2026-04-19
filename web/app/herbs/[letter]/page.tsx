import Link from "next/link";
import { getTaxonomy, LETTER_SLUG, SLUG_LETTER, pageUrlSlug, getPagesByCategory } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return Object.values(LETTER_SLUG).map((letter) => ({ letter }));
}

export async function generateMetadata({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const heLetter = SLUG_LETTER[letter];
  return { title: `צמחי מרפא — ${heLetter} — גאמנון` };
}

export default async function LetterPage({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const heLetter = SLUG_LETTER[letter];
  if (!heLetter) notFound();

  const tax = getTaxonomy();
  const bucket = tax.herb?.by_letter?.[heLetter];
  if (!bucket) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-sm mb-6 text-right" style={{ color: "var(--color-muted)" }}>
        <Link href="/herbs" style={{ color: "var(--color-herb)" }}>צמחי מרפא</Link>
        {" ← "}
        <span>{bucket.label}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-1 text-right" style={{ color: "var(--color-herb)" }}>
        {bucket.label}
      </h1>
      <p className="text-right mb-8" style={{ color: "var(--color-muted)" }}>
        {bucket.count} צמחים
      </p>

      <ul className="grid gap-2">
        {bucket.pages.map((p) => {
          const urlSlug = pageUrlSlug({ slug: p.slug } as Parameters<typeof pageUrlSlug>[0]);
          return (
            <li key={p.slug}>
              <Link href={`/herbs/${letter}/${urlSlug}`}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:shadow"
                style={{ background: "#fff", border: "1px solid var(--color-border)", textDecoration: "none" }}>
                <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>
                  {p.has_images ? "🖼" : ""}
                </span>
                <span className="font-medium" style={{ color: "var(--color-text)" }} dir="rtl">
                  {p.title_he}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
