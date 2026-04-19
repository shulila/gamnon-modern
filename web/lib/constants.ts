export type Category =
  | "herb" | "remedy" | "glossary" | "vitamin" | "mineral"
  | "recipe" | "gardening" | "panorama" | "article";

export type HebrewLetter =
  "א"|"ב"|"ג"|"ד"|"ה"|"ו"|"ז"|"ח"|"ט"|"י"|"כ"|"ל"|
  "מ"|"נ"|"ס"|"ע"|"פ"|"צ"|"ק"|"ר"|"ש"|"ת"|"אגוזים";

export const LETTER_SLUG: Record<string, string> = {
  "א":"alef","ב":"bet","ג":"gimel","ד":"dalet","ה":"hei","ו":"vav",
  "ז":"zayin","ח":"het","ט":"tet","י":"yod","כ":"kaf","ל":"lamed",
  "מ":"mem","נ":"nun","ס":"samech","ע":"ayin","פ":"peh","צ":"tzadi",
  "ק":"kof","ר":"resh","ש":"shin","ת":"tav","אגוזים":"nuts",
};

export const SLUG_LETTER: Record<string, string> = Object.fromEntries(
  Object.entries(LETTER_SLUG).map(([he, en]) => [en, he])
);

export interface SearchEntry {
  id: number;
  slug: string;
  url: string;
  title_he: string;
  body_he: string;
  category: Category;
  letter: string;
  has_images: boolean;
}

export const CATEGORY_LABEL: Record<string, string> = {
  herb: "צמחי מרפא",
  remedy: "מרפא ומחלות",
  glossary: "מילון",
  vitamin: "ויטמינים",
  mineral: "מינרלים",
  recipe: "מתכונים",
  gardening: "גינון",
  panorama: "פנורמה",
  article: "מאמרים",
};
