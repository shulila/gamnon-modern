"""
gamnon.net full scraper — fetches all internal pages recursively.
Saves each page as raw HTML in raw/pages/
Outputs raw/index.json with metadata per page.

Usage:
    py -3 scrape.py              # full crawl
    py -3 scrape.py --resume     # continue interrupted crawl
    py -3 scrape.py --dry-run    # show URLs only, no download
"""
import os, sys, json, time, hashlib, re, argparse
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from collections import deque

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DOMAIN = "www.gamnon.net"
START_URLS = [
    "https://www.gamnon.net/AG-NewHerbal/H-AllHerbList.htm",
    "https://www.gamnon.net/AG-NewHerbal/REMEDIEs/H-Remedies-List.html",
    "https://www.gamnon.net/AG-NewHerbal/Glossary/_GlossaryList.htm",
    "https://www.gamnon.net/AG-NewHerbal/Glossary/Vitamins/_H-Vitamins-List.html",
    "https://www.gamnon.net/AG-NewHerbal/Glossary/Minerals/_H-Minerals-List.html",
    "https://www.gamnon.net/AG-NewHerbal/RECIPEs/RecipesMenu.html",
    "https://www.gamnon.net/AG-NewHerbal/_Gardening/_Gardening-Index.htm",
    "https://www.gamnon.net/AG-NewHerbal/Panorama/_Panorama-Index.htm",
    "https://www.gamnon.net/AG-NewHerbal/GAmnon.html",
    "https://www.gamnon.net/AG-NewHerbal/Menu.html",
]
DELAY_SEC = 0.3          # polite delay between requests
TIMEOUT_SEC = 15
MAX_PAGES = 20_000       # safety ceiling
OUT_DIR = Path("raw/pages")
INDEX_FILE = Path("raw/index.json")
VISITED_FILE = Path("raw/visited.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; GamnonArchiver/1.0)",
    "Accept-Encoding": "identity",
    "Accept": "text/html,*/*",
}

# ── URL helpers ────────────────────────────────────────────────────────────────

def normalise(url: str) -> str:
    url, _ = urldefrag(url)
    return url.rstrip("/")

def is_internal(url: str) -> bool:
    p = urlparse(url)
    return (not p.netloc) or (p.netloc == BASE_DOMAIN)

def is_html(url: str) -> bool:
    path = urlparse(url).path.lower()
    # skip images, scripts, styles, known binary types
    skip_ext = {".gif", ".jpg", ".jpeg", ".png", ".ico", ".css", ".js",
                ".pdf", ".zip", ".mp3", ".mp4", ".swf", ".wav"}
    return not any(path.endswith(e) for e in skip_ext)

def extract_links(html: str, base_url: str) -> list[str]:
    # matches href= with or without quotes (old HTML style)
    pattern = re.compile(r'[Hh][Rr][Ee][Ff]\s*=\s*["\']?([^\s"\'<>#]+)["\']?')
    links = []
    for m in pattern.finditer(html):
        href = m.group(1).strip()
        if href.startswith("mailto:") or href.startswith("javascript:"):
            continue
        abs_url = normalise(urljoin(base_url, href))
        if is_internal(abs_url) and is_html(abs_url):
            links.append(abs_url)
    return links

def url_to_filename(url: str) -> str:
    h = hashlib.md5(url.encode()).hexdigest()[:8]
    path = urlparse(url).path
    name = Path(path).name or "index"
    name = re.sub(r"[^\w\-.]", "_", name)
    return f"{name}__{h}.html"

def decode_html(raw: bytes) -> str:
    for enc in ("iso-8859-8", "windows-1255", "utf-8", "latin-1"):
        try:
            return raw.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("utf-8", errors="replace")

# ── Fetch ──────────────────────────────────────────────────────────────────────

def fetch(url: str) -> tuple[str, int] | None:
    """Returns (html_text, status_code) or None on failure."""
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=TIMEOUT_SEC) as r:
            raw = r.read()
            status = r.status
        return decode_html(raw), status
    except HTTPError as e:
        return None
    except (URLError, TimeoutError, OSError):
        return None

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load state
    visited: dict[str, dict] = {}
    if args.resume and VISITED_FILE.exists():
        visited = json.loads(VISITED_FILE.read_text("utf-8"))
        print(f"Resuming — {len(visited)} already visited")

    queue: deque[str] = deque()
    for u in START_URLS:
        n = normalise(u)
        if n not in visited:
            queue.append(n)

    pages_done = len(visited)
    errors = 0

    print(f"Starting crawl from {len(START_URLS)} seed URLs")
    print(f"Output → {OUT_DIR.resolve()}\n")

    while queue and pages_done < MAX_PAGES:
        url = queue.popleft()
        if url in visited:
            continue

        if args.dry_run:
            print(f"[DRY] {url}")
            visited[url] = {"url": url, "dry_run": True}
            pages_done += 1
            continue

        result = fetch(url)
        if result is None:
            visited[url] = {"url": url, "status": "error"}
            errors += 1
            continue

        html, status = result

        # Save HTML
        filename = url_to_filename(url)
        filepath = OUT_DIR / filename
        filepath.write_text(html, encoding="utf-8")

        # Extract links and enqueue new ones
        links = extract_links(html, url)
        new_links = 0
        for link in links:
            if link not in visited and link not in queue:
                queue.append(link)
                new_links += 1

        visited[url] = {
            "url": url,
            "filename": filename,
            "status": status,
            "size_bytes": len(html.encode("utf-8")),
            "links_found": new_links,
        }

        pages_done += 1

        if pages_done % 50 == 0:
            # Save checkpoint
            VISITED_FILE.write_text(json.dumps(visited, ensure_ascii=False, indent=2), "utf-8")
            print(f"  [{pages_done}] queued={len(queue)} errors={errors}  last: {url[-60:]}")

        time.sleep(DELAY_SEC)

    # Final save
    VISITED_FILE.write_text(json.dumps(visited, ensure_ascii=False, indent=2), "utf-8")

    # Build index.json (successful pages only)
    index = [v for v in visited.values() if v.get("status") == 200 and "filename" in v]
    INDEX_FILE.write_text(json.dumps(index, ensure_ascii=False, indent=2), "utf-8")

    print(f"\n✅ Done — {pages_done} pages visited, {errors} errors")
    print(f"   Saved {len(index)} HTML files → {OUT_DIR.resolve()}")
    print(f"   Index → {INDEX_FILE.resolve()}")
    print(f"   Next: py -3 normalize_local.py")


if __name__ == "__main__":
    main()
