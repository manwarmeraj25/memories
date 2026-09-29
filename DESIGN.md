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
- **Any object metaphor.** An earlier build of this site was a bound leather
  album and it read as costume — the most literal possible reading of "photo
  archive". Nothing here is framed, mounted, bound, or pretending to be
  furniture. The only physical idea retained is a behaviour, not a thing:
  cloth gathering on a drawcord.
- Cream, beige and warm-bookish grounds, which is where this subject pulls by
  default and where the album build landed.

## Palette

Silk black at night, pearl silk by day. Gold is the only accent and it is
**always a control or a position marker** — a hairline, a node, an
attribution. It is never decoration and never a glow.

| | night | day |
|---|---|---|
| silk (ground) | `#080900` | `#E3E5E7` |
| shadow | `#050506` | `#D1D4D8` |
| gold | `#D4AF37` | `#6B5310` |
| graphite | `#2B2E33` | `#BFC3C8` |
| slate | `#4A5158` | `#7E858C` |
| ink | `#C7C9CC` | `#1B1E21` |
| ink-dim | `#8A9096` | `#4E545B` |

Text on a gold ground is tinted from the gold (`--on-gold`), never a neutral
grey. Every pairing clears 4.5:1 in both themes.

## Type

**Bodoni Moda** for display — the title, the year numerals, captions and the
open view's heading — set in **mixed case at normal spacing**. A high-contrast
didone is the native typographic voice of silk and thin gold linework, and
mixed case keeps it elegant rather than shouty. **Manrope** carries everything
else: prose, the year rail, and the readouts, which use its tabular figures
with a little tracking instead of borrowing a monospace.

Two faces, not three. Nothing on the page is set in wide-tracked capitals —
an earlier pass put the title, captions and every attribution in spaced-out
caps and it read cold and generic.

Both are self-hosted. The page must work offline and over `file://`.

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

Beneath it the whole archive runs past edge-on as a strip of every photograph.
It is **scroll-driven, not a timer**: the strip slides as the hero scrolls
away, so the plane moves because you pulled it. A time-based marquee would
loop forever and cost battery for nothing.

The title letters rise once on load. That single orchestrated entrance is the
page's only non-user-triggered motion; everything else answers a gesture.

## Composition

The words sit above the band the photographs sweep through — year at 12%,
note and quote beneath it, cord and thread at 62%. That vertical separation is
load-bearing: an earlier arrangement put the text in a left column and the
gathered panes swept straight over it.

The year rail is fixed chrome at the left, carries a scrim so it stays legible
when photographs pass beneath it, and marks where you are with a filled gold
node.

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
