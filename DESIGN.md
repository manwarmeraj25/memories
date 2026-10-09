# Design

The archive is one continuous plane threaded on a single cord. Scrolling pulls
the cord: the photograph you are on opens out at full size, and everything
else gathers toward the ends of the run, overlapping and leaning like pleated
cloth.

This file describes the world as built. `PRODUCT.md` owns product truth;
`.impeccable/surfaces/index-html.md` owns the direction contract.

## What it refuses

- The dark justified masonry grid this category ships, and the white
  editorial gallery that is its predictable opposite.
- **Furniture.** An earlier build of this site was a bound leather album and
  it read as costume — the most literal possible reading of "photo archive".
  Nothing here is framed, mounted, bound, or pretending to be a piece of
  furniture that holds photographs.
- An earlier revision of this file refused *any* object metaphor. That no
  longer holds and saying so would be a lie: at the owner's request the page
  is now built in relief (see **Relief** below). The distinction that
  survives is between a thing and a material — the page is one sheet with
  things raised out of it, not an album, a frame or a mount.
- Cream, beige and warm-bookish grounds, which is where this subject pulls by
  default and where the album build landed.

## Palette

Soft charcoal at night, pearl silk by day. Gold is the only accent and it is
**always a control or a position marker** — a bead, a node, an attribution.
It is never decoration and never a glow.

| | night | day |
|---|---|---|
| silk (the sheet) | `#1A1D21` | `#E3E5E7` |
| shadow (cut into it) | `#121417` | `#D4D8DC` |
| gold | `#D4AF37` | `#6B5310` |
| graphite | `#2B2E33` | `#BFC3C8` |
| slate | `#4A5158` | `#7E858C` |
| ink | `#C7C9CC` | `#1B1E21` |
| ink-dim | `#8A9096` | `#4E545B` |

The night ground used to be silk black `#080900`. It had to come up off black
to carry relief at all: an extruded surface needs a shadow *darker* than the
sheet it sits on, and nothing is darker than black. `--shadow` stopped being
"the deep behind the photographs" and became the floor of every channel and
trough — it is now one step *down* from the sheet rather than the bottom of
the world.

Text on a gold ground is tinted from the gold (`--on-gold`), never a neutral
grey. Measured in the browser, every text pairing clears 4.5:1 in both themes
(worst case 5.3:1, `--ink-dim` on the night sheet) and the two non-text
carriers of meaning — the resting nav node and the year numeral — clear 3:1
(worst case 3.2:1, the year in daylight).

## Relief

Nothing on this page is drawn with a border. A thing is either raised out of
the sheet or pressed into it, and the light always comes from the upper left.
Four recipes cover the whole surface:

| token | what it is | where |
|---|---|---|
| `--raise` | extruded slab | photographs, the year rail, the slip, the opened photograph |
| `--raise-sm` | a low lift | the lamp, the three keys, a hovered year |
| `--press` | sunk panel | the measure readout, the drifting slot, the caption trough, the year you are in |
| `--groove-h` / `--groove-v` | a narrow cut | the cord, the channel down the year rail, the seam above the tail |
| `--bead` | a small sphere | every gold node |

The grooves and the bead exist because `--press` and `--raise-sm` do not
scale down. Their blur is 7–10px, which is wider than a 10px cord or a 9px
bead — applied there the shadow floods the whole element and it reads as a
raised pill rather than a cut. A narrow cut gets one tight shadow on its
upper lip and one lit lip just outside it; a bead gets a highlight on its
crown and a short drop.

Relief is light pretending to be geometry, and it is a weak affordance. Two
things hold the line against that:

- **Focus stays a hard edge.** `:focus-visible` is a 2px gold outline at 4px
  offset — the one real border on the page, and deliberately not softened.
- **`prefers-contrast: more` gives the edges back.** All five relief tokens
  collapse to a 1px `--ink-dim` ring, the year numeral goes solid gold, and
  the embossed title drops its shadow. A user who has said the trick is not
  working for them stops being shown the trick.

Pressing is also a real state, not a hover tint: the year you are in is
pressed into the rail with its bead raised out of the channel, and keys,
photographs and years all travel under `:active`.

## Type

**Archivo Narrow** for display — the title, the year numerals, captions and
attributions — in caps with wide tracking, the way a garment label is set.
**Karla** for prose, carried over from the previous design at the owner's
request. **Azeret Mono** appears only on measurement: dates, counts, and the
position readout. It is never used as a costume for "technical".

A high-contrast didone in mixed case was tried here and rejected by the owner
in favour of this setting; the tracked caps are a chosen voice, not a default
that nobody looked at.

All three are self-hosted. The page must work offline and over `file://`.

## The gather

Distance from the photograph you are on decides everything about the others:

```
d     = index − position
close = 1 − e^(−|d| · 0.8)
x     = sign(d) · spread · close + d · 7px
scale = 1 − 0.4 · (1 − e^(−|d| · 0.95))
lean  = clamp(−d · 2.4°, ±9°)
dim   = 0.62 · close
```

The offset is asymptotic on purpose. Linear spacing would march photographs
off the screen like a filmstrip; an asymptote makes them pile toward the ends
and stack — which is what cloth does when you pull a cord through it. The
`d · 7px` term keeps a sliver of separation so a pile reads as pleats rather
than one solid block.

Only the photograph at the centre is at full size, full brightness, and
captioned. That is the rule the world has to obey: gathering may make the
periphery *suggestive*, never make a photograph you are looking at unreadable.

## The opening

The plane is introduced before it is pulled. The hero carries the title in
wide-tracked caps, who keeps the archive, the lede, the site quote, and a
readout of its measure — `22 held · 4 years · 2023–2026` — set on the cord
with its own gold node, in the mono, because that is measurement.

Beneath it the whole archive runs past edge-on as a strip of every photograph,
drifting continuously on a 90-second loop. This is the owner's call, kept
after a scroll-driven version was tried and rejected: the drift is what makes
the opening feel alive before anyone touches it. It stops entirely under
`prefers-reduced-motion`.

The design detector flags this as a `marquee`, and that finding stands — it is
overridden deliberately, not unseen.

The title letters also rise once on load. Those two are the page's only
non-user-triggered motion; everything else answers a gesture.

## Composition

The words sit above the band the photographs sweep through — year at 12%,
note and quote beneath it, cord and thread at 62%. That vertical separation is
load-bearing: an earlier arrangement put the text in a left column and the
gathered panes swept straight over it.

The year rail is fixed chrome at the left — a moulded strip lifted off the
page, with a channel carved down its spine. Photographs pass behind it rather
than through it, so it needs no scrim. Years rest as flush nodes in that
channel; the one you are in is a gold bead raised out of it, in a row that is
pressed into the strip. On a phone the same strip re-moulds as a dock lifted
off the bottom edge.

Because the rail is now a solid object with a shadow rather than a gradient
over the ground, the text column was moved right to clear it: `--gutter` runs
116px → 164px at its narrowest.

## Motion

Motion (vendored, `assets/js/vendor/motion.js`) drives the gather from scroll
progress, and springs the opened photograph from the rect it occupied on the
plane. `will-change` is set only on panes within 1.6 steps of centre and
cleared as they settle. There are no section-entrance fades and no hover
transitions on every element.

Under `prefers-reduced-motion`, on a phone, or in a short window, nothing
gathers: the plane lies flat and scrolls as a column of photographs. That is a
complete layout, not a degraded one.

## Addressing

Every photograph has its own URL (`#2025-still-water`). The archive is meant
to be sent to people who were there, so a single photograph is a place you can
link someone to. Opening, stepping and closing all keep the address bar in
step.

## Known state

The 22 images are generated placeholders, not photographs. The layout assumes
real photographs of mixed orientation will replace them, and no copy claims
they are real.
