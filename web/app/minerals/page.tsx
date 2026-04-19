import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";
import CategoryList from "@/components/CategoryList";
export const metadata = { title: "מינרלים — גאמנון" };
export default function Page() {
  const tax = getTaxonomy();
  const data = tax.mineral;
  return <CategoryList title={`💎 ${CATEGORY_LABEL.mineral}`} count={data.count} categoryHref="/minerals" pages={data.pages} />;
}
