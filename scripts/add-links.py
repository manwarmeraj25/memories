#!/usr/bin/env python3
"""Put image links into a year file, however messy they arrive.

    pbpaste | python3 scripts/add-links.py 2026      # straight from the clipboard
    python3 scripts/add-links.py 2026 < links.txt    # from a file
    python3 scripts/add-links.py 2026 https://a.jpg https://b.jpg

It accepts whatever you have: one link per line, links separated by commas or
spaces, a JSON array, or the whole year file the browser console script
copies. Anything that is not a link is ignored.

Existing links, and the year's note, quote and author, are kept. New links are
appended, duplicates are dropped. Google Photos links get a size suffix so the
page asks the CDN for a sensible width rather than the original.

    --width 2400     ask Google Photos for a different width (default 1800)
    --replace        discard the year's current links instead of appending
    --no-check       skip checking that each link is publicly readable

Every link is checked before it is filed. A Google Photos link copied from
your own library is tied to your signed-in session: it loads for you and
redirects everyone else to a sign-in page. Those are refused here rather than
quietly filed and discovered later as an archive full of holes. Links from a
shared album are public and pass.
"""
import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
YEARS = ROOT / "data" / "years"

URL_RE = re.compile(r"https?://[^\s\"'<>,\\\]}]+")
GPHOTOS_RE = re.compile(r"googleusercontent\.com/", re.I)
TRAILING = ".,;:)]}'\"" 


def clean(url, width):
    url = url.rstrip(TRAILING)
    if GPHOTOS_RE.search(url):
        # =w1800 / =s512-c / =w400-h300 … keep only the base and ask for ours
        url = url.split("=")[0] + f"=w{width}"
    return url


def entries_from(payload, width):
    """Pull every link out of whatever was handed to us, in order."""
    urls, seen, out = URL_RE.findall(payload), set(), []
    for u in urls:
        c = clean(u, width)
        if c not in seen:
            seen.add(c)
            out.append(c)
    return out


UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")


def reachable(url, timeout=20):
    """Is this link readable by someone who is not signed in as you?

    Uses curl rather than urllib: the python.org build on macOS ships without
    a CA bundle unless "Install Certificates.command" has been run, and a
    check that fails closed on every link is worse than no check at all.
    """
    try:
        r = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", str(timeout), "-o", os.devnull,
             "-r", "0-2047", "-A", UA,
             "-w", "%{http_code}\t%{content_type}\t%{url_effective}", url],
            capture_output=True, text=True, timeout=timeout + 10)
    except (OSError, subprocess.SubprocessError) as err:
        return False, f"could not check ({str(err)[:30]})"

    parts = (r.stdout or "").split("\t")
    if len(parts) < 3:
        return False, (r.stderr or "no response").strip()[:40]
    code, ctype, final = parts[0], parts[1].split(";")[0].strip(), parts[2]

    if ctype.startswith("image/"):
        return True, ctype
    if "accounts.google.com" in final:
        return False, "needs Google sign-in"
    return False, ctype or f"HTTP {code}"


def check_all(urls, workers=8):
    ok, bad = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        for url, (good, why) in zip(urls, pool.map(lambda u: reachable(u), urls)):
            (ok if good else bad).append(url if good else (url, why))
    return ok, bad


def key_of(photo):
    src = photo.get("src") if isinstance(photo, dict) else photo
    return (src or "").split("=")[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("year")
    ap.add_argument("links", nargs="*", help="links, if not piped in")
    ap.add_argument("--width", type=int, default=1800)
    ap.add_argument("--replace", action="store_true")
    ap.add_argument("--no-check", action="store_true",
                    help="skip checking that each link is publicly readable")
    args = ap.parse_args()

    if not (args.year.isdigit() and len(args.year) == 4):
        print(f"'{args.year}' is not a four-digit year.")
        return 1

    payload = " ".join(args.links)
    if not sys.stdin.isatty():
        payload += "\n" + sys.stdin.read()

    found = entries_from(payload, args.width)
    if not found:
        print("No links found in the input.")
        return 1

    if not args.no_check:
        print(f"Checking {len(found)} link(s) are readable without signing in…")
        found, bad = check_all(found)
        for url, why in bad:
            print(f"  refused ({why}): {url[:78]}…")
        if bad:
            print(f"\n{len(bad)} link(s) refused. A Google Photos link copied from")
            print("your own library only works while you are signed in — open the")
            print("shared album instead and take the links from there.")
        if not found:
            print("\nNothing left to file.")
            return 1

    out = YEARS / f"{args.year}.json"
    data = {"note": "", "quote": "", "author": "", "photos": []}
    if out.exists():
        try:
            existing = json.loads(out.read_text())
            if isinstance(existing, list):
                data["photos"] = existing
            elif isinstance(existing, dict):
                data.update(existing)
                data.setdefault("photos", [])
        except ValueError:
            print(f"{out.relative_to(ROOT)} is not valid JSON — leaving it alone.")
            return 1

    before = [] if args.replace else list(data.get("photos") or [])
    known = {key_of(p) for p in before}

    added = 0
    for url in found:
        if key_of(url) in known:
            continue
        known.add(key_of(url))
        before.append(url)
        added += 1

    data["photos"] = before
    YEARS.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    skipped = len(found) - added
    print(f"{out.relative_to(ROOT)}: {added} added"
          + (f", {skipped} already there" if skipped else "")
          + f" — {len(before)} links in {args.year} now.")
    if not data.get("quote"):
        print(f'  No quote yet for {args.year}. Add "quote" and "author" in that file.')
    return 0


if __name__ == "__main__":
    sys.exit(main())
