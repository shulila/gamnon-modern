"""
Reads raw/index.json + raw/pages/*.html → clean/pages.json
Usage: py -3 normalize_local.py
"""
import json, re, hashlib, sys
from pathlib import Path
from urllib.parse import urlparse
from html.parser import HTMLParser

RAW_DIR   = Path("raw/pages")
INDEX     = Path("raw/index.json")
OUT       = Path("clean/pages.json")

# ── Letter map ─────────────────────────────────────────────────────────────────
LETTER_MAP = {
    "Herbs01-Alef": "א", "Herbs02-Bet": "ב",  "Herbs03-Gimal": "ג",
    "Herbs04-Dalet": "ד","Herbs05-Hei": "ה",  "Herbs06-Vav": "ו",
    "Herbs07-Zayin": "ז","Herbs08-Het": "ח",  "Herbs09-Tet": "ט",
    "Herbs10-Yod": "י",  "Herbs11-Kaf": "כ",  "Herbs12-Lamed": "ל",
    "Herbs13-Mem": "מ",  "Herbs14-Nun": "נ",  "Herbs15-Samech": "ס",
    "Herbs16-Ayin": "ע", "Herbs17-Peh": "פ",  "Herbs18-Zadei": "צ",
    "Herbs19-Kof": "ק",  "Herbs20-Reish": "ר","Herbs21-Shin": "ש",
    "Herbs22-Tav": "ת",  "Herbs23-Nuts": "אגוזים",
}

def categorize(url):
    path = url.replace("https://www.gamnon.net/AG-NewHerbal/", "")
    for folder, letter in LETTER_MAP.items():
        if path.startswith(folder + "/"):
            return "herb", letter
    if path.startswith("REMEDIEs/"): return "remedy", None
    if path.startswith("Glossary/Vitamins/"): return "vitamin", None
    if path.startswith("Glossary/Minerals/"): return "mineral", None
    if path.startswith("Glossary/"): return "glossary", None
    if path.startswith("RECIPEs/"): return "recipe", None
    if path.startswith("_Gardening/"): return "gardening", None
    if path.startswith("Panorama/"): return "panorama", None
    return "article", None

def slugify(url):
    return (url
        .replace("https://www.gamnon.net/", "")
        .replace(".html", "").replace(".htm", "")
        .rstrip("/"))

# ── Simple HTML text extractor ─────────────────────────────────────────────────
class TextExtractor(HTMLParser):
    SKIP = {"script","style","head","noscript","noframes"}
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.title = ""
        self.in_skip = 0
        self.in_title = False
        self.images = []  # (src, alt, w, h)
        self.links = []

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        tag = tag.lower()
        if tag in self.SKIP: self.in_skip += 1
        if tag == "title": self.in_title = True
        if tag == "img":
            src = ad.get("src","")
            if re.search(r"\.(jpe?g|png)$", src, re.I):
                self.images.append({
                    "src": src,
                    "alt": ad.get("alt","").strip(),
                    "width": int(ad["width"]) if ad.get("width","").isdigit() else None,
                    "height": int(ad["height"]) if ad.get("height","").isdigit() else None,
                })
        if tag == "a" and "href" in ad:
            href = ad["href"]
            if not href.startswith(("mailto:","javascript:")):
                self.links.append(href)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in self.SKIP: self.in_skip = max(0, self.in_skip - 1)
        if tag == "title": self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        elif self.in_skip == 0:
            self.text_parts.append(data)

    def get_text(self):
        text = " ".join(self.text_parts)
        text = re.sub(r"Your browser does not support frames[!]?","", text, flags=re.I)
        text = re.sub(r"\s{3,}", "\n\n", text)
        return text.strip()

# ── Main ────────────────────────────────────────────────────────────────────────
print(f"Reading {INDEX}…", flush=True)
entries = json.loads(INDEX.read_text("utf-8"))
print(f"  {len(entries)} entries in index", flush=True)

pages = []
seen_hashes = set()
skipped_short = skipped_dup = errors = 0
by_cat = {}

for entry in entries:
    url = entry["url"]
    filename = entry.get("filename")
    if not filename:
        continue

    filepath = RAW_DIR / filename
    if not filepath.exists():
        errors += 1
        continue

    html = filepath.read_text("utf-8", errors="replace")

    parser = TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        pass

    body = parser.get_text()
    if len(body) < 50:
        skipped_short += 1
        continue

    h = hashlib.md5(body.encode()).hexdigest()
    if h in seen_hashes:
        skipped_dup += 1
        continue
    seen_hashes.add(h)

    title = parser.title.strip() or slugify(url).split("/")[-1]
    category, letter = categorize(url)
    by_cat[category] = by_cat.get(category, 0) + 1

    # clean images
    images = [{k: v for k, v in img.items() if v is not None} for img in parser.images]

    pages.append({
        "url": url,
        "slug": slugify(url),
        "category": category,
        **({"letter": letter} if letter else {}),
        "title_he": title,
        "body_he": body,
        "images": images,
        "internal_links": list(set(parser.links))[:50],
        "content_hash": h,
        "source_url": url,
        "last_fetched": entry.get("last_fetched", ""),
    })

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(pages, ensure_ascii=False, indent=2), "utf-8")

print(f"\n✅ {len(pages)} clean pages → {OUT}")
print(f"   Skipped: {skipped_short} too-short, {skipped_dup} duplicates, {errors} missing files")
print("\nBy category:")
for cat, n in sorted(by_cat.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {n}")
