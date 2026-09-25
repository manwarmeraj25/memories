#!/usr/bin/env python3
"""Scan assets/images/<year>/ and regenerate data/memories.js.

A folder named after a year becomes a section on the page — drop
assets/images/2027/ in with photographs and it appears, newest first.

Filename convention (everything after the date becomes the caption):
    YYYY-MM-DD-caption-words.jpg   ->  "Caption words", dated 2026-01-18
    YYYY-MM-caption-words.jpg      ->  "Caption words", dated 2026-01
    caption-words.jpg              ->  "Caption words", undated

Usage
    python3 scripts/build.py            rebuild once
    python3 scripts/build.py --watch    rebuild whenever the folders change

Or run scripts/serve.py, which rebuilds on every request and pushes new
sections into the open page live.
"""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "images"
QUOTES = ROOT / "data" / "quotes.json"
MANIFEST = ROOT / "data" / "memories.js"

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"}
YEAR_GLOB = "[0-9][0-9][0-9][0-9]"
DATE_RE = re.compile(r"^(\d{4})-(\d{2})(?:-(\d{2}))?[-_ ]*(.*)$")
SVG_DIM = re.compile(r'\b(width|height)\s*=\s*"(\d+(?:\.\d+)?)', re.I)
SVG_VB = re.compile(r'\bviewBox\s*=\s*"[\d.\s-]*?([\d.]+)[\s,]+([\d.]+)"', re.I)

# Measuring costs a subprocess per photograph, so remember what we've seen.
# Keyed by (path, mtime, size) so an edited file is re-measured.
_dim_cache: dict[tuple, tuple[int, int]] = {}


def year_folders():
    return sorted(
        (p for p in IMG_DIR.glob(YEAR_GLOB) if p.is_dir()),
        key=lambda p: p.name,
        reverse=True,
    )


def photo_files(folder):
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in EXTS)


def measure(path):
    """Return (w, h). Falls back to a 3:2 frame if the file can't be read."""
    st = path.stat()
    key = (str(path), st.st_mtime_ns, st.st_size)
    if key in _dim_cache:
        return _dim_cache[key]

    size = (1500, 1000)
    if path.suffix.lower() == ".svg":
        head = path.read_text(errors="ignore")[:2000]
        found = {k.lower(): float(v) for k, v in SVG_DIM.findall(head)}
        if "width" in found and "height" in found:
            size = (int(found["width"]), int(found["height"]))
        else:
            vb = SVG_VB.search(head)
            if vb:
                size = (int(float(vb.group(1))), int(float(vb.group(2))))
    else:
        try:
            out = subprocess.run(
                ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
                capture_output=True, text=True, timeout=20).stdout
            w = re.search(r"pixelWidth:\s*(\d+)", out)
            h = re.search(r"pixelHeight:\s*(\d+)", out)
            if w and h:
                size = (int(w.group(1)), int(h.group(1)))
        except (OSError, subprocess.SubprocessError):
            pass

    _dim_cache[key] = size
    return size


def parse_name(stem):
    m = DATE_RE.match(stem)
    if m:
        y, mo, d, rest = m.groups()
        date = f"{y}-{mo}-{d}" if d else f"{y}-{mo}"
    else:
        date, rest = "", stem
    words = re.sub(r"[-_]+", " ", rest).strip()
    caption = (words[:1].upper() + words[1:]) if words else "Untitled"
    return date, caption


def signature():
    """A cheap fingerprint of the archive — changes when anything does."""
    parts = []
    for folder in year_folders():
        for f in photo_files(folder):
            st = f.stat()
            parts.append(f"{folder.name}/{f.name}:{st.st_mtime_ns}:{st.st_size}")
    if QUOTES.exists():
        st = QUOTES.stat()
        parts.append(f"quotes:{st.st_mtime_ns}:{st.st_size}")
    return hashlib.sha1("|".join(parts).encode()).hexdigest()[:16]


def load_config(stub_new_years=True):
    """Read quotes.json, adding a blank entry for any year we haven't seen."""
    try:
        cfg = json.loads(QUOTES.read_text())
    except (OSError, ValueError):
        cfg = {}
    cfg.setdefault("site", {})
    cfg.setdefault("years", {})

    added = []
    if stub_new_years:
        present = {f.name for f in year_folders()}

        for name in sorted(present, reverse=True):
            if name not in cfg["years"]:
                cfg["years"][name] = {"note": "", "quote": "", "author": ""}
                added.append(name)

        # a year whose folder is gone and which never had words written for it
        # is just clutter — but anything you typed is always kept
        blank = [
            name for name, v in cfg["years"].items()
            if name not in present
            and not any((v or {}).get(k) for k in ("note", "quote", "author"))
        ]
        for name in blank:
            del cfg["years"][name]

        if added or blank:
            cfg["years"] = dict(
                sorted(cfg["years"].items(), key=lambda kv: kv[0], reverse=True))
            try:
                QUOTES.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")
            except OSError:
                pass
    return cfg, added


def scan(stub_new_years=True):
    cfg, added = load_config(stub_new_years)
    years_cfg = cfg.get("years", {})

    years, total = [], 0
    for folder in year_folders():
        photos = []
        for f in photo_files(folder):
            date, caption = parse_name(f.stem)
            w, h = measure(f)
            photos.append({
                "src": f"assets/images/{folder.name}/{f.name}",
                "caption": caption,
                "date": date,
                "w": w,
                "h": h,
            })
        meta = years_cfg.get(folder.name) or {}
        years.append({
            "year": folder.name,
            "note": meta.get("note", ""),
            "quote": meta.get("quote", ""),
            "author": meta.get("author", ""),
            "photos": photos,
        })
        total += len(photos)

    payload = {
        "site": cfg.get("site", {}),
        "years": years,
        "total": total,
        "signature": signature(),
    }
    return payload, added


def write_manifest(payload):
    MANIFEST.write_text(
        "/* Generated by scripts/build.py — do not edit by hand.\n"
        "   Add photographs to assets/images/<year>/ and re-run the script,\n"
        "   or run scripts/serve.py and they appear on the page by themselves. */\n"
        "window.MEMORIES = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n"
    )


def report(payload, added):
    print(f"{MANIFEST.relative_to(ROOT)}: "
          f"{payload['total']} photographs across {len(payload['years'])} years")
    for y in payload["years"]:
        print(f"  {y['year']}  {len(y['photos']):>3} photo(s)")
    if added:
        print(f"  new year(s) {', '.join(added)} — add their quotes in "
              f"{QUOTES.relative_to(ROOT)}")


def watch(interval=1.5):
    print("Watching assets/images/ — add a year folder or photographs "
          "and this rebuilds. Ctrl-C to stop.")
    last = None
    try:
        while True:
            sig = signature()
            if sig != last:
                last = sig
                payload, added = scan()
                write_manifest(payload)
                print(f"\n[{time.strftime('%H:%M:%S')}] rebuilt")
                report(payload, added)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nstopped.")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--watch", action="store_true",
                    help="rebuild continuously as the image folders change")
    args = ap.parse_args()

    if args.watch:
        watch()
        return 0

    payload, added = scan()
    write_manifest(payload)
    report(payload, added)
    return 0


if __name__ == "__main__":
    sys.exit(main())
