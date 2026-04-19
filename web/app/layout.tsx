import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "גאמנון — אנציקלופדיית צמחי המרפא",
  description: "אנציקלופדיית צמחי מרפא, תרופות טבעיות, ויטמינים ומינרלים בעברית",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen flex flex-col antialiased" style={{ fontFamily: "var(--font-heebo), Arial Hebrew, Arial, sans-serif" }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-sm" style={{ color: "var(--color-muted)", borderTop: "1px solid var(--color-border)" }}>
          <p>גאמנון מודרני — מבוסס על תוכן מקורי של גאמנון.נט</p>
        </footer>
      </body>
    </html>
  );
}
