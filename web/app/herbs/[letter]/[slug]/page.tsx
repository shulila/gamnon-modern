import { getTaxonomy, LETTER_SLUG, SLUG_LETTER, getPages, pageUrlSlug } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import ContentBody from "@/components/ContentBody";

export function generateStaticParams() {
  const tax = getTaxonomy();
  const params: { letter: string; slug: string }[] = [];
  for (const [heLetter, enSlug] of Object.entries(LETTER_SLUG)) {
    const bucket = tax.herb?.by_letter?.[heLetter];
    if (!bucket) continue;
    for (const p of bucket.pages) {
      params.push({ letter: enSlug, slug: pageUrlSlug({ slug: p.slug } as Parameters<typeof pageUrlSlug>[0]) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ letter: string; slug: string }> }) {
  const { letter, slug } = await params;
  const heLetter = SLUG_LETTER[letter];
  const page = getPages().find(
    (p) => p.category === "herb" && p.letter === heLetter && pageUrlSlug(p) === slug
  );
  return { title: page ? `${page.title_he} — גאמנון` : "גאמנון" };
}

export default async function HerbPage({ params }: { params: Promise<{ letter: string; slug: string }> }) {
  const { letter, slug } = await params;
  const heLetter = SLUG_LETTER[letter];
  if (!heLetter) notFound();

  const page = getPages().find(
    (p) => p.category === "herb" && p.letter === heLetter && pageUrlSlug(p) === slug
  );
  if (!page) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm mb-6 text-right" style={{ color: "var(--color-muted)" }}>
        <Link href="/herbs" style={{ color: "var(--color-herb)" }}>צמחי מרפא</Link>
        {" ← "}
        <Link href={`/herbs/${letter}`} style={{ color: "var(--color-herb)" }}>{heLetter}</Link>
      </nav>

      <h1 className="text-3xl font-bold mb-6 text-right" dir="rtl" style={{ color: "var(--color-herb)" }}>
        {page.title_he}
      </h1>

      {page.images.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-end mb-6">
          {page.images.slice(0, 3).map((img, i) => (
            <div key={i} className="rounded overflow-hidden"
              style={{ width: img.width ?? 160, height: img.height ?? 120, background: "var(--color-herb-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "2rem" }}>🌿</span>
            </div>
          ))}
        </div>
      )}

      <ContentBody text={page.body_he} />

      <div className="mt-8 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-sm"
          style={{ color: "var(--color-muted)" }}>
          מקור: gamnon.net ↗
        </a>
      </div>
    </article>
  );
}
