# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase, no framework. Static `index.html` + one stylesheet + one
vanilla-JS file, served by a Python 3 standard-library script. No npm, no
bundler, no transpile step — the README's promise is "nothing to install; it's
the Python that ships with macOS", and that promise is a product fact, not an
implementation accident.

Confirmed this session: the Motion animation library may be used, **vendored
locally** into the repo (not loaded from a CDN), so the page keeps working
offline and when opened straight from the Finder via `file://`.

Confirmed this session: the redesign may replace `index.html`,
`assets/css/styles.css`, `assets/js/main.js` **and** the Python build scripts,
including the shape of the generated data.

## Users

Manwar, plus family and close friends — people who were present for what is in
the photographs. They arrive already knowing the subjects; nobody needs to be
introduced or explained. The job is revisiting: opening the archive to move
through years and land on a specific remembered moment.

This is not a public portfolio and not a private-to-one-person vault. It sits
between: shareable with people who were there, via a link on the local network
(`serve.py --lan`) or by opening the folder.

## Product Purpose

Keep everything worth keeping, filed by the year it happened in, and make
moving back through those years feel like something. Success is that adding
photographs costs nothing (drop a folder, it appears) and that opening the page
makes someone stay longer than they meant to.

## Positioning

The filesystem *is* the CMS. A new folder named after a year becomes a new
section of the site on its own — no code edit, no config entry, no rebuild
step when the server is running. Most photo-archive sites make you register
each photograph somewhere; this one reads the folder and the filename and asks
for nothing else. That mechanism is the thing to protect.

## Operating Context

- `python3 scripts/serve.py` runs and stays running. Photographs are dropped
  into `assets/images/<year>/` in the Finder and appear in the already-open
  page within about two seconds, with a corner note saying what changed.
- `python3 scripts/serve.py --lan` prints a LAN address so a phone on the same
  wi-fi can open it. Off by default, on purpose.
- `index.html` opened directly from the Finder also works; it shows whatever
  was last filed, and `python3 scripts/build.py` refiles.
- Viewing happens on a laptop and on phones, including phones held sideways.

## Capabilities and Constraints

Confirmed functionality the redesign must keep working:

- **Filename convention carries the metadata.** `2026-01-18-first-light.jpg`
  → caption "First light", dated 18 Jan 2026. Month-only and undated forms are
  both supported. Extensions: `.jpg .jpeg .png .webp .avif .gif .svg`.
- **Years descend.** Newest year first, years running backwards down the page.
- **Live sync.** The page polls `api/signature`; on change it refetches
  `api/memories` and re-renders in place, holding scroll position. On a static
  host the probe 404s twice and the page quietly stops asking.
- **Words live in `data/quotes.json`.** Site title, owner, lede, headline
  quote; per year a note, a quote and an author. A new year folder gets a blank
  entry added automatically; a removed year's *blank* entry is tidied away, but
  anything actually typed is never deleted.
- **Full-size view** for any photograph, with keyboard arrows, `Esc`, and on
  touch swipe-sideways to move and swipe-down to dismiss.
- **Theme** follows the OS with a manual override remembered per browser.
- **Dimensions are measured at file time** (`sips` on macOS, parsed directly
  for SVG) so layout never jumps while images load.
- **Reduced motion** and narrow/short viewports drop out of any pinned or
  hijacked scrolling into ordinary native scrolling.

Technical constraints:

- Python 3 standard library only. `sips` is macOS-only and already has a
  fallback path.
- No network dependency at view time.
- Must survive being opened over `file://`.

## Brand Commitments

- The name **Memories** and the owner name **Manwar**.
- Everything readable on the page comes from `data/quotes.json` and is
  user-authored. Copy in that file is content, not design filler, and is not
  rewritten without asking.

## Evidence on Hand

- 22 generated placeholder SVGs across 2023–2026, in known aspect ratios
  (3:2, 3:4, 1:1, 16:10, 16:9). **These are stand-ins, not photographs.** The
  design must not imply real photographic content that does not exist, and no
  real photographs, people, places or events may be invented in copy.
- Four years of user-written notes, quotes and attributions in
  `data/quotes.json` — real content, to be preserved verbatim.
- No logo, no brand assets, no typeface licence beyond Google Fonts.

## Product Principles

1. **Adding a photograph stays free.** Any design that requires touching code,
   config or metadata to file a new photograph has broken the product.
2. **The photographs outrank the interface.** Chrome earns its place or goes.
3. **Works with nothing installed and nothing connected.** Offline, `file://`,
   and a stock Python are all supported states, not degraded ones.
4. **The archive is unfinished on purpose.** It gains years. Empty years,
   single-photograph years and a year still in progress are normal states to
   design for, not edge cases.
5. **Written words are the owner's.** The system supplies structure; the
   person supplies meaning.

## Accessibility & Inclusion

No formal standard was established as a product requirement. Existing
behaviour to preserve: keyboard operation of the full-size view, visible focus,
`prefers-reduced-motion` honoured by dropping scroll hijacking entirely, alt
text built from caption plus date, and a skip link to the archive.
