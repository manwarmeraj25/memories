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
  has been built in relief, then in glass, and is now modelled in clay (see
  **Material**). What survives of the refusal is only this — the page is a
  material, not a piece of furniture. It is not an album, and the clay lip
  around a photograph is a lip, not a mount.
- Cream, beige and warm-bookish grounds, which is where this subject pulls by
  default and where the album build landed. The table is violet, not beige,
  for exactly that reason.

## Palette

Clay has to be tinted. Grey clay gives the inner light and the inner shade
nothing to read against, and the whole material collapses into neumorphism.
The table is a soft violet with three lumps of colour worked into it —
periwinkle, a warm ochre and a cool green — and gold stays the only accent,
**always a control or a position marker**, never decoration.

| | night | day |
|---|---|---|
| silk (the table) | `#1C1930` | `#E7E5F4` |
| shadow (what a photograph is pressed into) | `#15122A` | `#D5D0EA` |
| clay (the body of a lump) | `#282443` | `#EFEDFA` |
| gold | `#E2BE5A` | `#7A5A12` |
| graphite | `#342F52` | `#C6C1E0` |
| slate | `#6B6391` | `#8A84AC` |
| ink | `#EDEAF8` | `#211D33` |
| ink-dim | `#A9A2C6` | `#55506E` |

The ground has now moved three times — silk black `#080900`, up to `#1A1D21`
so relief had something to cast onto, across to `#12151A` plus an
environment for glass to sample, and now to violet because clay is coloured
or it is nothing. Night gold was brightened to `#E2BE5A`; the old `#D4AF37`
sat flat against indigo.

Measured in the browser, every text pairing clears 4.5:1 on both the table
and the clay, in both themes — worst case 5.1:1, gold on the daylight table.
The nav bead clears the 3:1 non-text floor; `--slate` measured **2.64:1** on
night clay and was replaced with `--ink-dim` there.

## Material

Everything is a lump of clay: thick, opaque, tinted, lit from inside its top
edge, shaded inside its lower right, and dropped onto a wide coloured
shadow. Nothing has a border and nothing is transparent.

| token | what it is | where |
|---|---|---|
| `--clay-lg` | a big lump | photographs, the year rail |
| `--clay-md` | a medium lump | the slip, a hovered key or lamp |
| `--clay-sm` | a small lump | keys, the lamp, the cord, a hovered year |
| `--clay-in` | a thumbprint pushed in | the measure readout, the caption bar, the year you are in |
| `--clay-in-sm` | a shallow thumbprint | the cord pressed into the rail, the seam above the tail, anything `:active` |

The three sizes exist because the inner pair has to scale with the object.
The full-size light-and-shade inside a 46px button fills it solid and the
thing stops reading as clay at all — the same failure the groove tokens
solved in the relief build, arrived at from the other direction.

Pressing is real: keys and years squash (`scale`) *and* invert to a
thumbprint under `:active`, and the year you are in stays pressed with its
bead sitting proud of the dent.

Depth is parallax, carried over from the glass build and toned down: the
pointer publishes `--px` / `--py` on the root and the hero reads them in CSS
— title 10px, lede 6px, the year numeral 3px, the drifting strip 12px the
other way. One rAF, one cached rect, nothing on a touchscreen.

### The photographs

A photograph sits in an 11px lip of clay with the picture pressed down into
it, and the whole lump takes the gather's dimming rather than just the
picture — a lit bezel around a darkened photograph reads as a frame, which
is the one thing this page refuses.

This is the closest the design has come to the mount it rejects, and the lip
is thin on purpose. It is a judgement call, and it is the cost of the
material.

### Opt-outs

Clay is a soft shape made entirely of soft light.

- **`prefers-contrast: more`** — all five recipes collapse to 2px `--ink-dim`
  rings, the warm-hand highlight goes off, the cords become solid rules, and
  the selected year is outlined in gold.
- **`prefers-reduced-motion`** — the drift and the parallax stop. The clay
  stays, because the clay is not motion.

Focus never participates: `:focus-visible` is a 3px gold outline at 5px
offset, the only hard edge on the page.

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

The year rail is fixed chrome at the left — one thick slab of clay with the
cord rolled into its face. Photographs pass behind it, and because the clay
is opaque it needs no scrim. Each year is a bead on that cord, and the one
you are in is a thumbprint pressed into the slab with its bead gold and
sitting proud of the dent. On a phone the same slab is re-rolled as a bar of
clay lying along the bottom edge.

Because the rail is a solid object with a shadow rather than a gradient over
the ground, the text column was moved right to clear it: `--gutter` runs
116px → 164px at its narrowest.

## Motion

Motion (vendored, `assets/js/vendor/motion.js`) drives the gather from scroll
progress, and springs the opened photograph from the rect it occupied on the
plane. `will-change` is set only on panes within 1.6 steps of centre and
cleared as they settle. There are no section-entrance fades and no hover
transitions on every element.

Pointer parallax is the page's other motion, and it is CSS reading two
custom properties rather than anything animating — see **Depth**.

Under `prefers-reduced-motion`, on a phone, or in a short window, nothing
gathers: the plane lies flat and scrolls as a column of photographs. That is a
complete layout, not a degraded one. Reduced motion also stops the drift and
the parallax outright; the material and its depth stay, because they are
static.

## Addressing

Every photograph has its own URL (`#2025-still-water`). The archive is meant
to be sent to people who were there, so a single photograph is a place you can
link someone to. Opening, stepping and closing all keep the address bar in
step.

## Known state

The 22 images are generated placeholders, not photographs. The layout assumes
real photographs of mixed orientation will replace them, and no copy claims
they are real.
