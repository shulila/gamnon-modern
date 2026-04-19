"""
Content Phase 3 — Taxonomy + Search Index
Reads scraper/clean/pages.json → content/taxonomy.json + content/search-index.json

Usage:  py -3 build.py
"""
import json, re
from pathlib import Path
from urllib.parse import urlparse

ROOT     = Path(__file__).parent
PAGES    = ROOT.parent / "scraper/clean/pages.json"
TAX_OUT  = ROOT / "taxonomy.json"
SRCH_OUT = ROOT / "search-index.json"
XREF_OUT = ROOT / "crossrefs.json"

# Hebrew letter → display label
LETTER_LABEL = {
    "א": "א - אלף", "ב": "ב - בית", "ג": "ג - גימל", "ד": "ד - דלת",
    "ה": "ה - הא",  "ו": "ו - וו",  "ז": "ז - זיין","ח": "ח - חית",
    "ט": "ט - טית", "י": "י - יוד", "כ": "כ - כף",  "ל": "ל - למד",
    "מ": "מ - מם",  "נ": "נ - נון", "ס": "ס - סמך", "ע": "ע - עין",
    "פ": "פ - פא",  "צ": "צ - צדי","ק": "ק - קוף", "ר": "ר - ריש",
    "ש": "ש - שין", "ת": "ת - תו", "אגוזים": "אגוזים",
}

LETTER_ORDER = list("אבגדהוזחטיכלמנסעפצקרשת") + ["אגוזים"]


def page_stub(p: dict) -> dict:
    return {
        "slug": p["slug"],
        "title_he": p["title_he"],
        "url": p["url"],
        **({"letter": p["letter"]} if p.get("letter") else {}),
        "has_images": bool(p.get("images")),
    }


def resolve_internal_link(href: str, source_url: str) -> str | None:
    """Turn a relative or absolute href into an absolute gamnon.net URL."""
    if href.startswith("http"):
        return href if "gamnon.net" in href else None
    from urllib.parse import urljoin, urldefrag
    parsed = urlparse(source_url)
    dir_path = parsed.path.rsplit("/", 1)[0] + "/"
    base = f"{parsed.scheme}://{parsed.netloc}{dir_path}"
    abs_url, _ = urldefrag(urljoin(base, href))
    return abs_url if "gamnon.net" in abs_url else None


def build_taxonomy(pages: list[dict]) -> dict:
    cats: dict[str, dict] = {}

    for p in pages:
        cat = p["category"]
        if cat not in cats:
            cats[cat] = {"count": 0, "pages": [], "by_letter": {}}
        cats[cat]["count"] += 1

        stub = page_stub(p)

        if cat == "herb" and p.get("letter"):
            letter = p["letter"]
            if letter not in cats[cat]["by_letter"]:
                cats[cat]["by_letter"][letter] = {
                    "label": LETTER_LABEL.get(letter, letter),
                    "count": 0,
                    "pages": [],
                }
            cats[cat]["by_letter"][letter]["count"] += 1
            cats[cat]["by_letter"][letter]["pages"].append(stub)
        else:
            cats[cat]["pages"].append(stub)

    # Sort letter buckets in aleph-bet order
    for cat_data in cats.values():
        if cat_data["by_letter"]:
            sorted_letters = {
                k: cat_data["by_letter"][k]
                for k in LETTER_ORDER
                if k in cat_data["by_letter"]
            }
            cat_data["by_letter"] = sorted_letters

    return cats


def build_search_index(pages: list[dict]) -> list[dict]:
    entries = []
    for i, p in enumerate(pages):
        body = p["body_he"]
        # Trim body for index (first 800 chars for snippet)
        entries.append({
            "id": i,
            "slug": p["slug"],
            "url": p["url"],
            "title_he": p["title_he"],
            "body_he": body[:800],
            "category": p["category"],
            "letter": p.get("letter", ""),
            "has_images": bool(p.get("images")),
        })
    return entries


def build_crossrefs(pages: list[dict]) -> dict:
    """
    For each page, resolve internal_links to actual slugs in the dataset.
    Returns {slug → [linked_slug, ...]}
    """
    url_to_slug = {p["url"].rstrip("/"): p["slug"] for p in pages}

    xrefs: dict[str, list[str]] = {}
    for p in pages:
        slug = p["slug"]
        targets = []
        for href in p.get("internal_links", []):
            abs_url = resolve_internal_link(href, p["url"])
            if not abs_url:
                continue
            abs_url = abs_url.rstrip("/")
            target_slug = url_to_slug.get(abs_url)
            if target_slug and target_slug != slug:
                targets.append(target_slug)
        if targets:
            xrefs[slug] = list(dict.fromkeys(targets))  # dedupe, preserve order

    return xrefs


# ── Main ──────────────────────────────────────────────────────────────────────

pages = json.loads(PAGES.read_text("utf-8"))
print(f"Loaded {len(pages)} pages from {PAGES.relative_to(ROOT.parent)}")

taxonomy = build_taxonomy(pages)
TAX_OUT.write_text(json.dumps(taxonomy, ensure_ascii=False, indent=2), "utf-8")
total_cats = len(taxonomy)
print(f"Taxonomy: {total_cats} categories → {TAX_OUT.relative_to(ROOT.parent)}")
for cat, data in taxonomy.items():
    letters = len(data.get("by_letter", {}))
    print(f"  {cat}: {data['count']} pages" + (f", {letters} letters" if letters else ""))

search_index = build_search_index(pages)
SRCH_OUT.write_text(json.dumps(search_index, ensure_ascii=False, indent=2), "utf-8")
print(f"\nSearch index: {len(search_index)} entries → {SRCH_OUT.relative_to(ROOT.parent)}")

xrefs = build_crossrefs(pages)
XREF_OUT.write_text(json.dumps(xrefs, ensure_ascii=False, indent=2), "utf-8")
linked = sum(len(v) for v in xrefs.values())
print(f"Cross-refs: {len(xrefs)} pages with outgoing links ({linked} total) → {XREF_OUT.relative_to(ROOT.parent)}")

print("\n✅ Phase 3 complete")
