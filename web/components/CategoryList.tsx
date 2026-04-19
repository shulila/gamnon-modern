import Link from "next/link";
import type { PageStub } from "@/lib/data";

export default function CategoryList({
  title, count, categoryHref, pages,
}: {
  title: string;
  count: number;
  categoryHref: string;
  pages: PageStub[];
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1 text-right" style={{ color: "var(--color-herb)" }}>
        {title}
      </h1>
      <p className="text-right mb-8" style={{ color: "var(--color-muted)" }}>{count} ערכים</p>

      <ul className="grid gap-2">
        {pages.map((p) => {
          const urlSlug = p.slug.split("/").pop()!.toLowerCase();
          return (
            <li key={p.slug}>
              <Link href={`${categoryHref}/${urlSlug}`}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:shadow"
                style={{ background: "#fff", border: "1px solid var(--color-border)", textDecoration: "none" }}>
                <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>
                  {p.has_images ? "🖼" : ""}
                </span>
                <span className="font-medium text-right" dir="rtl" style={{ color: "var(--color-text)" }}>
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
