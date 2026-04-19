import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";
import CategoryList from "@/components/CategoryList";
export const metadata = { title: "מילון — גאמנון" };
export default function Page() {
  const tax = getTaxonomy();
  const data = tax.glossary;
  return <CategoryList title={`📖 ${CATEGORY_LABEL.glossary}`} count={data.count} categoryHref="/glossary" pages={data.pages} />;
}
