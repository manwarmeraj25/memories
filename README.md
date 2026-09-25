# Memories

A personal photo archive, filed year by year. The newest year sits at the top of
the page and the years run backwards as you scroll. Inside each year the
photographs travel sideways while you scroll down through that year.

Run it with:

```sh
python3 scripts/serve.py
```

Leave that running and the site builds itself: drop a folder like
`assets/images/2027/` in with some photographs and the new section appears in
the open page within about two seconds — no rebuild, no reload. Nothing to
install; it's the Python that ships with macOS.

You can also just open `index.html` straight from the Finder. A page opened
that way can't look inside folders by itself, so it shows whatever was last
filed — run `python3 scripts/build.py` after adding photos.

## Folder structure

```
memories/
├── index.html                  the page
├── assets/
│   ├── css/styles.css          all styling (light + dark themes)
│   ├── js/main.js              scroll engine, pointer effects, lightbox
│   └── images/
│       ├── 2026/               one folder per year — this is where your photos go
│       ├── 2025/
│       ├── 2024/
│       └── 2023/
├── data/
│   ├── quotes.json             ← you edit this: the quotes and year captions
│   └── memories.js             ← generated: the photo manifest, don't hand-edit
└── scripts/
    ├── serve.py                run this — serves the site and rebuilds live
    ├── build.py                one-off rebuild of the manifest
    └── make-placeholders.py    regenerates the stand-in images
```

## Adding your photographs

1. Drop files into `assets/images/<year>/`. Create the year folder if it
   doesn't exist — **a new year folder becomes a new section on its own**,
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
3. That's it, if `scripts/serve.py` is running — the section appears by itself
   and a small note in the corner tells you what changed.

   If you opened `index.html` from the Finder instead, run `python3
   scripts/build.py` once and reload, or leave `python3 scripts/build.py
   --watch` running to rebuild on every change.

Either way the images are measured (via `sips`) as they're filed, so the
layout never jumps while photographs load.

## Changing the words

Everything readable lives in `data/quotes.json`:

- `site` — the title, your name, the opening paragraph and the headline quote.
- `years` — per year, a `note` (the small line under the year) plus a `quote`
  and its `author`.

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
rm assets/images/*/*-placeholder.svg   # if you kept that suffix
# or simply
rm assets/images/*/*.svg
python3 scripts/build.py
```

## How it behaves

- **Wide screens** — each year pins to the viewport and its photographs slide
  horizontally as you scroll. Trackpad side-swipes and click-and-drag move the
  page along too.
- **Phones, short windows, or "reduce motion" on** — the pinning switches off
  and each year becomes an ordinary swipeable row with scroll snapping.
- **Click any frame** for the full-size view; arrow keys move between
  photographs, `Esc` closes.
- **Theme** follows the operating system, and the sun/moon button in the year
  rail overrides it. The choice is remembered per browser.

## On a phone

The layout switches at 880px wide (or under 540px tall, which catches a phone
held sideways):

- Years stop pinning and become swipeable rows that snap photo to photo.
- Photographs are sized by **width** there, so a landscape shot stays
  landscape instead of being cropped into a tall frame.
- Captions and dates are always visible — on a desktop they appear on hover,
  which a touchscreen has no way to do.
- The year rail moves to a bar along the bottom with thumb-sized targets. It
  scrolls sideways if you have more years than fit, and keeps the year you're
  looking at centred.
- In the full-size view, swipe sideways to move between photographs and swipe
  down to dismiss.
- The film-grain flicker and the cursor glow switch off, since one is a
  pointless battery cost on a phone and the other needs a pointer.
- Text and the bottom bar stay clear of the notch and the home indicator.

To check it on your actual phone, start the server with `--lan`:

```sh
python3 scripts/serve.py --lan
```

It prints an address like `http://192.168.1.24:8000/` — open that on a phone
on the same wi-fi. Live rebuilding works there too. Without the flag the
server only listens on this machine, which is the default on purpose: `--lan`
means anyone on the network can view the archive.
