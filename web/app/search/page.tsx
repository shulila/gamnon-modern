import { getSearchIndex } from "@/lib/data";
import SearchClient from "./SearchClient";

export const metadata = { title: "חיפוש — גאמנון" };

export default function SearchPage() {
  const entries = getSearchIndex();
  return <SearchClient entries={entries} />;
}
