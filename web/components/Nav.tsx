import Link from "next/link";

const LINKS = [
  { href: "/herbs", label: "צמחי מרפא" },
  { href: "/remedies", label: "מרפא ומחלות" },
  { href: "/glossary", label: "מילון" },
  { href: "/vitamins", label: "ויטמינים" },
  { href: "/minerals", label: "מינרלים" },
  { href: "/recipes", label: "מתכונים" },
  { href: "/gardening", label: "גינון" },
  { href: "/search", label: "חיפוש" },
];

export default function Nav() {
  return (
    <header style={{ background: "var(--color-herb)", color: "#fff" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 flex-wrap">
        <Link href="/" className="font-bold text-xl tracking-wide shrink-0" style={{ color: "#fff", textDecoration: "none" }}>
          גאמנון
        </Link>
        <nav className="flex gap-4 flex-wrap text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={{ color: "#d4edda", textDecoration: "none" }}
              className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
