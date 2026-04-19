import Link from "next/link";
import { getTaxonomy, LETTER_SLUG } from "@/lib/data";

export const metadata = { title: "צמחי מרפא — גאמנון" };

const LETTER_ORDER = "אבגדהוזחטיכלמנסעפצקרשת".split("").concat(["אגוזים"]);

export default function HerbsPage() {
  const tax = getTaxonomy();
  const herbData = tax.herb?.by_letter ?? {};

  const letters = LETTER_ORDER.filter((l) => herbData[l]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2 text-right" style={{ color: "var(--color-herb)" }}>
        🌿 צמחי מרפא
      </h1>
      <p className="text-right mb-8" style={{ color: "var(--color-muted)" }}>
        {tax.herb?.count ?? 0} צמחים — בחרו אות
      </p>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {letters.map((letter) => {
          const data = herbData[letter];
          const slug = LETTER_SLUG[letter];
          return (
            <Link key={letter} href={`/herbs/${slug}`}
              className="rounded-lg p-3 text-center transition-all hover:scale-105 hover:shadow"
              style={{ background: "#fff", border: "1px solid var(--color-border)", textDecoration: "none" }}>
              <div className="text-2xl font-bold" style={{ color: "var(--color-herb)" }}>{letter}</div>
              <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{data.count}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
