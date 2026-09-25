#!/usr/bin/env python3
"""Write the stand-in frames used before real photographs are filed.

Safe to re-run: it never overwrites a file that already exists, so your own
photographs are left alone. Delete the generated .svg files once you have
real ones, then run scripts/build.py.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

#      date          caption slug         w     h    hueA hueB
SPEC = [
    ("2026-01-18", "first-light",       1800, 1200, 214,  34),
    ("2026-02-09", "the-long-table",    1200, 1600,  12,  44),
    ("2026-04-02", "blue-hour",         1600, 1600, 268, 210),
    ("2026-05-27", "off-the-map",       1800, 1125, 158,  46),
    ("2026-07-11", "someone-laughing",  1200, 1600, 338,  22),
    ("2025-01-22", "cold-start",        1800, 1200, 236, 206),
    ("2025-03-14", "still-water",       1600, 1600, 196, 168),
    ("2025-04-30", "late-set",          1200, 1600, 322, 284),
    ("2025-06-08", "kitchen-window",    1800, 1125,  48,  30),
    ("2025-08-19", "rain-then-not",     1200, 1600, 212, 190),
    ("2025-10-05", "the-old-route",     1600, 1067,  88,  52),
    ("2025-12-24", "last-of-the-light", 1800, 1200,   6,  36),
    ("2024-02-11", "harvest-road",      1800, 1200,  28,   8),
    ("2024-03-29", "red-awning",        1200, 1600,  18, 348),
    ("2024-06-16", "green-season",      1600, 1600, 132,  74),
    ("2024-09-01", "night-bus",         1800, 1125, 260, 226),
    ("2024-10-20", "two-chairs",        1200, 1600,  40,  20),
    ("2024-12-07", "coast-briefly",     1600, 1067, 190, 160),
    ("2023-03-05", "where-it-started",  1800, 1200, 274, 240),
    ("2023-05-21", "paper-lanterns",    1200, 1600,  34,  14),
    ("2023-08-13", "the-quiet-room",    1600, 1600, 168, 112),
    ("2023-11-30", "one-more-song",     1800, 1125, 350,  26),
]

TPL = """<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="Placeholder photograph">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl({a} 44% 22%)"/>
      <stop offset=".5" stop-color="hsl({b} 40% 44%)"/>
      <stop offset="1" stop-color="hsl({b} 58% 72%)"/>
    </linearGradient>
    <radialGradient id="s" cx=".72" cy=".24" r=".8">
      <stop offset="0" stop-color="hsl({b} 92% 84%)" stop-opacity=".7"/>
      <stop offset="1" stop-color="hsl({a} 60% 18%)" stop-opacity="0"/>
    </radialGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#g)"/>
  <rect width="{w}" height="{h}" fill="url(#s)"/>
  <g fill="none" stroke="hsl({b} 80% 90%)" stroke-opacity=".2" stroke-width="2">
    <circle cx="{cx}" cy="{cy}" r="{r1}"/><circle cx="{cx}" cy="{cy}" r="{r2}" stroke-opacity=".1"/>
    <path d="M0 {y1} Q {q1} {y0} {hw} {y1b} T {w} {y1c}"/>
    <path d="M0 {y2} Q {q2} {y1} {q3} {y2b} T {w} {y2c}" stroke-opacity=".13"/>
  </g>
  <rect width="{w}" height="{h}" filter="url(#n)" opacity=".15"/>
  <text x="{pad}" y="{ty}" font-family="ui-monospace, Menlo, monospace" font-size="{fs}" fill="hsl({b} 20% 97%)" fill-opacity=".55" letter-spacing="{ls}">PLACEHOLDER</text>
</svg>
"""


def main():
    made = skipped = 0
    for date, slug, w, h, a, b in SPEC:
        folder = ROOT / "assets" / "images" / date[:4]
        folder.mkdir(parents=True, exist_ok=True)
        out = folder / f"{date}-{slug}.svg"
        if out.exists():
            skipped += 1
            continue
        out.write_text(TPL.format(
            w=w, h=h, a=a, b=b,
            cx=int(w * .7), cy=int(h * .25), r1=h // 7, r2=h // 4,
            y0=int(h * .58), y1=int(h * .72), y1b=int(h * .70), y1c=int(h * .64),
            y2=int(h * .84), y2b=int(h * .82), y2c=int(h * .76),
            q1=w // 4, q2=w // 3, q3=int(w * 2 / 3), hw=w // 2,
            pad=w // 16, ty=h // 16 + h // 26,
            fs=max(11, h // 34), ls=max(2, h // 170)))
        made += 1
    print(f"placeholders: {made} written, {skipped} already present")


if __name__ == "__main__":
    main()
