import { getPages, pageUrlSlug } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import ContentBody from "@/components/ContentBody";

const CAT = "glossary" as const;
const BASE = "/glossary";

export function generateStaticParams() {
  return getPages()
    .filter((p) => p.category === CAT)
    .map((p) => ({ slug: pageUrlSlug(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPages().find((p) => p.category === CAT && pageUrlSlug(p) === slug);
  return { title: page ? `${page.title_he} — גאמנון` : "גאמנון" };
}

export default async function DetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPages().find((p) => p.category === CAT && pageUrlSlug(p) === slug);
  if (!page) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm mb-6 text-right" style={{ color: "var(--color-muted)" }}>
        <Link href={BASE} style={{ color: "var(--color-herb)" }}>מילון</Link>
      </nav>
      <h1 className="text-3xl font-bold mb-6 text-right" dir="rtl" style={{ color: "var(--color-herb)" }}>
        {page.title_he}
      </h1>
      <ContentBody text={page.body_he} />
      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: "var(--color-muted)" }}>
          מקור: gamnon.net ↗
        </a>
      </div>
    </article>
  );
}
