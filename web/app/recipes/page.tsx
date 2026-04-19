import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";
import CategoryList from "@/components/CategoryList";
export const metadata = { title: "מתכונים — גאמנון" };
export default function Page() {
  const tax = getTaxonomy();
  const data = tax.recipe;
  return <CategoryList title={`🍵 ${CATEGORY_LABEL.recipe}`} count={data.count} categoryHref="/recipes" pages={data.pages} />;
}
