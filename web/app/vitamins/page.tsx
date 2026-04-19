import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";
import CategoryList from "@/components/CategoryList";
export const metadata = { title: "ויטמינים — גאמנון" };
export default function Page() {
  const tax = getTaxonomy();
  const data = tax.vitamin;
  return <CategoryList title={`🌟 ${CATEGORY_LABEL.vitamin}`} count={data.count} categoryHref="/vitamins" pages={data.pages} />;
}
