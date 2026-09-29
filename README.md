# Memories

A personal photo archive, threaded year by year. Each year is a run of
photographs held on one cord: the one you are on opens out at full size and
the rest gather toward the ends, overlapping and leaning like pleated cloth.
The newest year sits at the top and the years run backwards as you scroll.

Run it with:

```sh
python3 scripts/serve.py
```

Leave that running and the site builds itself: drop a folder like
`assets/images/2027/` in with some photographs and the new run appears in
the open page within about two seconds — no rebuild, no reload. Nothing to
install; it's the Python that ships with macOS.

You can also just open `index.html` straight from the Finder. A page opened
that way can't look inside folders by itself, so it shows whatever was last
filed — run `python3 scripts/build.py` after adding photos. Everything the
page needs is in the folder: the typefaces and the animation library are
kept locally, so it works with no network at all.

## Folder structure

```
memories/
├── index.html                  the page
├── assets/
│   ├── css/styles.css          all styling (both themes)
│   ├── js/main.js              the gather, the open view, live sync
│   ├── js/vendor/motion.js     Motion, vendored — no install, no CDN
│   ├── fonts/                  Bodoni Moda + Manrope, self-hosted
│   └── images/
│       ├── 2026/               one folder per year — this is where your photos go
│       ├── 2025/
│       ├── 2024/
│       └── 2023/
├── data/
│   ├── quotes.json             ← you edit this: the quotes and year notes
│   └── memories.js             ← generated: the photo manifest, don't hand-edit
└── scripts/
    ├── serve.py                run this — serves the site and rebuilds live
    ├── build.py                one-off rebuild of the manifest
    └── make-placeholders.py    regenerates the stand-in images
```

`PRODUCT.md`, `DESIGN.md` and `.impeccable/` record what the product is and
how the plane is built. They don't ship to the page.

## Adding your photographs

1. Drop files into `assets/images/<year>/`. Create the year folder if it
   doesn't exist — **a new year folder becomes a new run on its own**,
   slotted into place by year with the newest at the top. You never edit any
   code to add a year.
2. Name them so the page can read a date and a caption off the filename:

   | Filename                          | Caption        | Date        |
   | --------------------------------- | -------------- | ----------- |
   | `2026-01-18-first-light.jpg`      | *First light*  | 18 Jan 2026 |
   | `2026-04-blue-hour.jpg`           | *Blue hour*    | Apr 2026    |
   | `off-the-map.jpg`                 | *Off the map*  | —           |

   Within a year, photographs appear in filename order, so a leading date keeps
   them chronological. `.jpg .jpeg .png .webp .avif .gif .svg` are all accepted.
3. That's it, if `scripts/serve.py` is running — the run threads itself on and
   a note in the corner tells you what changed.

   If you opened `index.html` from the Finder instead, run `python3
   scripts/build.py` once and reload, or leave `python3 scripts/build.py
   --watch` running to rebuild on every change.

Either way the images are measured (via `sips`) as they're filed, so the
layout never jumps while photographs load.

## Changing the words

Everything readable lives in `data/quotes.json`:

- `site` — the title, your name, the opening paragraph and the closing quote.
- `years` — per year, a `note` (the line under the year) plus a `quote`
  and its `author`.

The site quote and your name sit at the end of the plane, after the last year.

When a new year folder shows up, a blank entry for it is added to this file
automatically, so there's always somewhere obvious to type. A year left blank
still renders — it just shows the photographs without a quote. Edits take
effect the same way photographs do: instantly under `serve.py`, or on the next
`build.py` run.

Delete a year's folder and its blank entry is tidied away too. Anything you
actually wrote is never removed.

## Removing the placeholders

The 22 gradient frames currently in `assets/images/` are stand-ins so the page
has something to show. Delete them once your own photos are in:

```sh
rm assets/images/*/*.svg
python3 scripts/build.py
```

## How it behaves

- **The opening** names the archive: the title, who keeps it, your lede and
  quote, and how much is held. Under it the whole archive drifts past as a
  strip — it slides as you scroll rather than looping on a timer.
- **Wide screens** — each year's run pins to the viewport and the cord pulls
  as you scroll down through it. The photograph you are on is full size and
  captioned; the others gather toward the ends of the run and fall back into
  the ground. Trackpad side-swipes and click-and-drag pull the cord too.
- **Phones, short windows, or "reduce motion" on** — nothing gathers. The
  plane lies flat: the year, its note, then its photographs one after another.
- **Click any photograph** to open it whole. Arrow keys move between
  photographs, `Esc` closes. On a touchscreen, swipe sideways to move and
  swipe down to dismiss.
- **Every photograph has its own link.** Opening one puts its address in the
  bar — `#2025-still-water` — so you can send somebody straight to it. Opening
  that link goes directly to that photograph.
- **Keyboard** — tabbing to a photograph that is currently gathered pulls the
  cord to it, so the whole archive is reachable without a mouse.
- **The room follows your system** — silk black at night, pearl by day. The
  photographs are the only colour either way. The switch at the bottom of the
  year rail overrides it, and the choice is remembered per browser.

## On a phone

The layout switches at 880px wide (or under 540px tall, which catches a phone
held sideways):

- The plane lies flat and scrolls normally.
- Photographs keep their own shape — a landscape shot stays landscape.
- Captions and dates are always visible.
- The year rail moves to a bar along the bottom with thumb-sized targets.
  It scrolls sideways if you have more years than fit, and keeps the year
  you're looking at centred.
- Text and the bottom bar stay clear of the notch and the home indicator.

To check it on your actual phone, start the server with `--lan`:

```sh
python3 scripts/serve.py --lan
```

It prints an address like `http://192.168.1.24:8000/` — open that on a phone
on the same wi-fi. Live rebuilding works there too. Without the flag the
server only listens on this machine, which is the default on purpose: `--lan`
means anyone on the network can view the archive.
