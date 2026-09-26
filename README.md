# Memories

A personal photo archive, filed year by year. The newest year sits at the top
of the page and the years run backwards as you scroll. Inside each year the
photographs travel sideways while you scroll down through that year.

Everything is driven by JSON. There is **no build step and no manifest** — the
page reads `data/years/<year>.json` directly, so creating a file is all it
takes for a section to exist.

```sh
python3 scripts/serve.py --browser safari
```

Leave that running. Drop `data/years/2022.json` in and the 2022 section
appears in the open page within about two seconds — no rebuild, no reload.
Editing a quote or a list of links works the same way.

## Adding a year

Create `data/years/<year>.json`. That's the whole procedure — the section is
sorted into place by year, newest first.

```json
{
  "note": "Long roads and longer tables",
  "quote": "Memory is the diary that we all carry about with us.",
  "author": "Oscar Wilde",
  "photos": [
    "https://images.example.com/trip/01.jpg",
    "https://images.example.com/trip/02.jpg"
  ]
}
```

Or run `python3 scripts/new-year.py 2022` to write that skeleton for you.

### Pasting in a pile of links

You rarely have links in the right shape already. `scripts/add-links.py` takes
them however they arrive — one per line, comma separated, a JSON array, or the
whole file the Google Photos console script copies — and files them:

```sh
pbpaste | python3 scripts/add-links.py 2026        # straight from the clipboard
python3 scripts/add-links.py 2026 < links.txt      # from a file
python3 scripts/add-links.py 2026 https://a.jpg    # or just as arguments
```

It appends to whatever is already there, drops duplicates, and leaves the
year's note, quote and author untouched. Google Photos links get a `=w1800`
size suffix so the page asks the CDN for a sensible width; `--width 2400`
changes that, and `--replace` starts the list over.

Every field is optional except `photos`:

| Field    | What it is                                                |
| -------- | --------------------------------------------------------- |
| `note`   | the small line under the year                              |
| `quote`  | the pull-quote for the section                             |
| `author` | who said it                                                |
| `photos` | the image links                                            |

If all you have is links, the file can be a bare array and nothing else:

```json
["https://images.example.com/a.jpg", "https://images.example.com/b.jpg"]
```

### Giving a photograph a caption

An entry can be a plain link or an object. Mixing the two in one list is fine.

```json
"photos": [
  "https://images.example.com/a.jpg",
  {
    "src": "https://images.example.com/b.jpg",
    "caption": "The long table",
    "date": "2026-02-09",
    "w": 1600,
    "h": 1067,
    "full": "https://images.example.com/b-2400.jpg"
  }
]
```

- `caption` — shown on the card. Without one, the card is titled by its `date`.
- `date` — `YYYY-MM-DD` or `YYYY-MM`.
- `w` / `h` — the image's pixel size. **Worth adding if you have it**: the
  layout then reserves the right shape before the image arrives, instead of
  settling once it loads.
- `full` — a larger version for the full-size viewer, if you host two sizes.

### Getting links out of a Google Photos album

**Take the links from the shared album, not from your own library.** A link
copied out of photos.google.com while you are signed in is bound to your
session: it loads for you and redirects everyone else to a Google sign-in
page. A link from the public share page is readable by anyone.
`scripts/add-links.py` checks this for you and refuses the private ones.

A shared album page builds itself with JavaScript and keeps only the visible
thumbnails in the document, so nothing outside a browser can read the whole
list — fetching the share URL returns just the cover photo. Run
`scripts/from-google-photos.js` in your browser's console **on the share
page** (`https://photos.app.goo.gl/…?_imcp=1` opens it in the browser rather
than the app): it scrolls to the end, collects every link, and copies a
ready-made year file to your clipboard.

**Worth knowing before you rely on it.** Google's `lh3.googleusercontent.com`
links do work in an `<img>` and accept a size suffix (`=w1800`), but they are
not a CDN Google offers for other people's websites. They can be rotated, and
they stop working the moment the album stops being shared. For an archive you
intend to keep, put the images somewhere meant for hosting — Cloudflare R2,
Backblaze B2, Cloudinary, even a second GitHub repository — and point the JSON
at those instead.

### The site's own text

`site.json` holds the title, your name, the opening paragraph and the headline
quote.

## Folder structure

```
memories/
├── index.html                the page
├── site.json                 title, owner, opening text, headline quote
├── assets/
│   ├── css/styles.css        all styling (light + dark themes)
│   └── js/main.js            loader, scroll engine, pointer effects, lightbox
├── data/years/
│   ├── index.json            generated list of years, for static hosting
│   ├── 2026.json             ← one file per year: quote + image links
│   ├── 2025.json
│   ├── 2024.json
│   ├── 2023.json
│   └── 2022.json
└── scripts/
    ├── serve.py              run this — serves the site and syncs it live
    └── new-year.py           writes a new year file from a template
```

No images are stored in this repository. The links point wherever you host
them.

## How the years are discovered

A web page can't list a directory, so the page tries three things in order:

1. **`/api/years`** — `scripts/serve.py` answers this with the real contents
   of `data/years/`. Authoritative, and instant.
2. **`data/years/index.json`** — a plain list the server rewrites whenever the
   folder changes. This is what makes the site work on a static host.
3. **Direct probing** — with neither of the above, the page asks for
   `data/years/<year>.json` across a range of years and keeps the ones that
   answer.

So it works under the dev server, on GitHub Pages, and on any plain static
host, with no configuration. The one place it cannot work is opening
`index.html` from the Finder: a `file://` page is not allowed to read its own
data files, and the page will say so.

## On a phone

The layout switches at 880px wide (or under 540px tall, which catches a phone
held sideways):

- Years stop pinning and become swipeable rows that snap photo to photo.
- Photographs are sized by **width**, so a landscape shot stays landscape
  instead of being cropped into a tall frame.
- Captions are always visible — on a desktop they appear on hover, which a
  touchscreen has no way to do.
- The year rail moves to a bar along the bottom with thumb-sized targets.
- In the full-size view, swipe sideways to move between photographs and swipe
  down to dismiss.
- The film-grain flicker and the cursor glow switch off.

To check it on your phone, start the server with `--lan`; it prints an address
to open on the same wi-fi.

## Years with a lot of links

A year's rail shows at most 40 frames, spread evenly across the list, because
a rail of several hundred would be hundreds of screen-heights of sideways
scrolling. Nothing is hidden: the year's footer gets a **View all N** button
that opens a contact sheet, and the full-size viewer steps through every one.
Change `RAIL_MAX` in `assets/js/main.js` to taste.

## In VS Code

`Cmd+Shift+B` runs **Memories: run in Safari**. `Run and Debug` (Cmd+Shift+D)
has the same plus a phone-testing variant and a Python debug configuration for
`serve.py`. VS Code has no Safari debug adapter, so these launch Safari rather
than attach to it — inspect the page in Safari's own Web Inspector
(Develop → localhost).

## How it behaves

- **Wide screens** — each year pins to the viewport and its photographs slide
  horizontally as you scroll. Trackpad side-swipes and click-and-drag work too.
- **Click any frame** for the full-size view; arrow keys move between
  photographs, `Esc` closes.
- **Theme** follows the operating system, and the sun/moon button in the year
  rail overrides it. The choice is remembered per browser.
