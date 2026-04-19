import { getTaxonomy, CATEGORY_LABEL } from "@/lib/data";
import CategoryList from "@/components/CategoryList";
export const metadata = { title: "גינון — גאמנון" };
export default function Page() {
  const tax = getTaxonomy();
  const data = tax.gardening;
  return <CategoryList title={`🌱 ${CATEGORY_LABEL.gardening}`} count={data.count} categoryHref="/gardening" pages={data.pages} />;
}
