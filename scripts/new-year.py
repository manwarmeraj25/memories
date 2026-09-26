#!/usr/bin/env python3
"""Start a new year file.

    python3 scripts/new-year.py 2022

Writes data/years/2022.json from a template and refuses to overwrite one that
already exists. With the server running, the section appears in the open page
as soon as the file lands — you can fill in the links afterwards.
"""
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
YEARS = ROOT / "data" / "years"

TEMPLATE = {
    "note": "",
    "quote": "",
    "author": "",
    "photos": [
        "https://example.com/replace-me-1.jpg",
        "https://example.com/replace-me-2.jpg",
    ],
}


def main(argv):
    if len(argv) > 1:
        year = argv[1].strip()
    else:
        year = input(f"Which year? [{date.today().year}] ").strip() or str(date.today().year)

    if not (year.isdigit() and len(year) == 4):
        print(f"'{year}' is not a four-digit year.")
        return 1

    YEARS.mkdir(parents=True, exist_ok=True)
    out = YEARS / f"{year}.json"
    if out.exists():
        print(f"{out.relative_to(ROOT)} already exists — leaving it alone.")
        return 1

    out.write_text(json.dumps(TEMPLATE, indent=2) + "\n")
    print(f"Created {out.relative_to(ROOT)}")
    print("Replace the example links, and add a quote and author if you want one.")
    print("With scripts/serve.py running, the section is already on the page.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
