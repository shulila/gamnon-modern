"""
Image Pipeline — Phase 2
1. Build manifest from pages.json
2. Download originals to raw/
3. Convert to WebP + AVIF in enhanced/
4. Generate 10px blur placeholders (base64)
5. Output index.json

Usage:
    py -3 build.py               # full run
    py -3 build.py --manifest    # manifest only (no download)
    py -3 build.py --resume      # skip already-downloaded
"""
import json, re, sys, base64, hashlib, argparse, time
from pathlib import Path
from io import BytesIO
from urllib.parse import urljoin, urlparse, urldefrag, quote
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

from PIL import Image

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).parent
PAGES_JSON = ROOT.parent / "scraper/clean/pages.json"
RAW_DIR    = ROOT / "raw"
ENH_DIR    = ROOT / "enhanced"
MANIFEST   = ROOT / "manifest.json"
INDEX      = ROOT / "index.json"

RAW_DIR.mkdir(exist_ok=True)
ENH_DIR.mkdir(exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity"}
WEBP_Q  = 85
BLUR_SIZE = 10   # px for placeholder
LOW_RES_PX = 400 # flag as upscale candidate

# ── URL resolution ─────────────────────────────────────────────────────────────

def resolve_img_url(src: str, page_url: str) -> str | None:
    src = src.strip().replace("\\", "/")
    if not src or src.startswith(("data:", "javascript:", "mailto:")):
        return None
    if src.startswith("http"):
        url = src
    else:
        # get directory of the page URL
        parsed = urlparse(page_url)
        dir_path = parsed.path.rsplit("/", 1)[0] + "/"
        base = f"{parsed.scheme}://{parsed.netloc}{dir_path}"
        url = urljoin(base, src)
    url, _ = urldefrag(url)
    if "gamnon.net" not in url:
        return None
    return url

# ── Manifest: collect all unique images ───────────────────────────────────────

def build_manifest() -> list[dict]:
    pages = json.loads(PAGES_JSON.read_text("utf-8"))
    seen: dict[str, dict] = {}

    for page in pages:
        page_url = page["url"]
        for img in page.get("images", []):
            src = img.get("src", "")
            abs_url = resolve_img_url(src, page_url)
            if not abs_url:
                continue
            if abs_url not in seen:
                safe_name = re.sub(r"[^\w\-.]", "_", Path(urlparse(abs_url).path).name)
                h = hashlib.md5(abs_url.encode()).hexdigest()[:6]
                filename = f"{h}_{safe_name}"
                seen[abs_url] = {
                    "url": abs_url,
                    "filename": filename,
                    "alt_he": img.get("alt", ""),
                    "width_hint": img.get("width"),
                    "height_hint": img.get("height"),
                    "found_on": page_url,
                    "status": "pending",
                }

    manifest = list(seen.values())
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
    print(f"Manifest: {len(manifest)} unique images → {MANIFEST}")
    return manifest

# ── Download ──────────────────────────────────────────────────────────────────

def fetch_image(url: str) -> bytes | None:
    try:
        parsed = urlparse(url)
        safe_path = quote(parsed.path, safe="/:@!$&'()*+,;=")
        url = parsed._replace(path=safe_path).geturl()
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=15) as r:
            return r.read()
    except (HTTPError, URLError, TimeoutError):
        return None

# ── Processing ────────────────────────────────────────────────────────────────

def make_blur_placeholder(img: Image.Image) -> str:
    thumb = img.convert("RGB").resize((BLUR_SIZE, BLUR_SIZE), Image.LANCZOS)
    buf = BytesIO()
    thumb.save(buf, format="JPEG", quality=30)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

def process_image(raw_bytes: bytes, filename_stem: str) -> dict | None:
    try:
        img = Image.open(BytesIO(raw_bytes))
        w, h = img.size
        fmt = img.format or "UNKNOWN"

        # WebP
        webp_path = ENH_DIR / f"{filename_stem}.webp"
        img.convert("RGB").save(webp_path, format="WEBP", quality=WEBP_Q, method=6)

        # AVIF
        avif_path = ENH_DIR / f"{filename_stem}.avif"
        try:
            img.convert("RGB").save(avif_path, format="AVIF", quality=WEBP_Q)
        except Exception:
            avif_path = None  # AVIF not always available

        placeholder = make_blur_placeholder(img)

        return {
            "width": w, "height": h,
            "original_format": fmt,
            "original_size_bytes": len(raw_bytes),
            "webp_path": str(webp_path.relative_to(ROOT.parent)),
            "avif_path": str(avif_path.relative_to(ROOT.parent)) if avif_path else None,
            "placeholder": placeholder,
            "needs_upscale": w < LOW_RES_PX,
        }
    except Exception as e:
        return None

# ── Main ──────────────────────────────────────────────────────────────────────

def build_metadata_index(manifest: list[dict]) -> None:
    """Write index.json from manifest metadata only (no download needed)."""
    entries = []
    for entry in manifest:
        w = entry.get("width_hint")
        h = entry.get("height_hint")
        entries.append({
            **entry,
            "width": w,
            "height": h,
            "original_format": None,
            "original_size_bytes": None,
            "webp_path": None,
            "avif_path": None,
            "placeholder": None,
            "needs_upscale": (w < LOW_RES_PX) if isinstance(w, int) else None,
            "status": "metadata_only",
        })
    INDEX.write_text(json.dumps(entries, ensure_ascii=False, indent=2), "utf-8")
    print(f"Metadata index: {len(entries)} images → {INDEX}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", action="store_true", help="Build manifest only")
    parser.add_argument("--resume", action="store_true", help="Skip already processed")
    parser.add_argument("--metadata-only", action="store_true", help="Write index from manifest without downloading")
    args = parser.parse_args()

    # Build / load manifest
    if MANIFEST.exists() and (args.resume or args.metadata_only):
        manifest = json.loads(MANIFEST.read_text("utf-8"))
        print(f"Loaded manifest: {len(manifest)} images")
    else:
        manifest = build_manifest()

    if args.manifest:
        return

    if args.metadata_only:
        build_metadata_index(manifest)
        return

    # Process
    total = len(manifest)
    done = errors = skipped = needs_upscale = 0
    index_entries = []

    for i, entry in enumerate(manifest):
        url = entry["url"]
        filename = entry["filename"]
        stem = Path(filename).stem

        raw_path = RAW_DIR / filename

        # Resume: skip if WebP already exists
        webp_path = ENH_DIR / f"{stem}.webp"
        if args.resume and webp_path.exists():
            skipped += 1
            # Rebuild index entry from existing files
            try:
                img = Image.open(webp_path)
                w, h = img.size
                placeholder = make_blur_placeholder(img)
                avif = ENH_DIR / f"{stem}.avif"
                index_entries.append({**entry, "width": w, "height": h,
                    "webp_path": f"image-pipeline/enhanced/{stem}.webp",
                    "avif_path": f"image-pipeline/enhanced/{stem}.avif" if avif.exists() else None,
                    "placeholder": placeholder, "needs_upscale": w < LOW_RES_PX, "status": "ok"})
            except Exception:
                pass
            continue

        # Download
        raw_bytes = fetch_image(url)
        if raw_bytes is None:
            errors += 1
            entry["status"] = "error"
            continue

        raw_path.write_bytes(raw_bytes)

        # Process
        result = process_image(raw_bytes, stem)
        if result is None:
            errors += 1
            entry["status"] = "error_processing"
            continue

        if result["needs_upscale"]:
            needs_upscale += 1

        index_entries.append({**entry, **result, "status": "ok"})
        done += 1
        time.sleep(0.1)  # polite

        if (i + 1) % 50 == 0:
            print(f"  [{i+1}/{total}] done={done} errors={errors} upscale_needed={needs_upscale}")

    # Save index
    INDEX.write_text(json.dumps(index_entries, ensure_ascii=False, indent=2), "utf-8")

    print(f"\n✅ Image pipeline complete")
    print(f"   Processed: {done}, Skipped (resume): {skipped}, Errors: {errors}")
    print(f"   Needs upscale (<{LOW_RES_PX}px): {needs_upscale}")
    print(f"   Index → {INDEX}")

if __name__ == "__main__":
    main()
