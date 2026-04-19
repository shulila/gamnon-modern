import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";
import CategoryList from "@/components/CategoryList";
export const metadata = { title: "מרפא ומחלות — גאמנון" };
export default function Page() {
  const tax = getTaxonomy();
  const data = tax.remedy;
  return <CategoryList title={`💊 ${CATEGORY_LABEL.remedy}`} count={data.count} categoryHref="/remedies" pages={data.pages} />;
}
