# GBHS Sports Hall of Fame — Inaugural Class

A single-page "digital book" for the Granite Bay High School Sports Hall of Fame,
celebrating the school's 30th anniversary (1996–2026). Fourteen inductees, presented
as a page-turning keepsake that works on a phone, a laptop, or a projector.

**Event:** Saturday, October 3, 2026 · Granite Bay Golf Club
**Keynote:** Ron Severson

---

## What's here

```
index.html              The whole app shell
assets/css/book.css     All styling: brushed-silver + GBHS green, page-flip mechanics
assets/js/data.js       All content — names, highlights, retrospectives. Edit this to change text.
assets/js/book.js       The page-flip engine, routing, lightbox
assets/img/plates/      The 14 engraved nameplates
assets/img/photos/      6 curated photos per inductee (p = full, t = thumbnail)
assets/img/ui/          Crest, flyer, master QR code
qr/                     One QR code per inductee + a printable sheet
build/                  Python scripts used to generate the images and QR codes
```

No build step, no dependencies, no framework. It is plain HTML, CSS, and JavaScript —
open `index.html` and it runs.

## The book

60 pages / 30 leaves. Each inductee gets four consecutive pages, padded so the portrait always falls on a
left-hand page and the portrait + highlights read as a single spread — the same layout
as the original slide deck:

1. **Portrait** — nameplate, hero photo, tagline
2. **Highlights** — the six career headlines from the program deck
3. **Gallery** — five more photos (click any to enlarge)
4. **Retrospective** — the coach's, teammate's, or family member's tribute
5. **Biography** — the athlete's own career write-up, where one exists

Most inductees have four pages. Anyone with both a retrospective and a biography
(Andrew Knapp) gets five, and the spread padding absorbs it automatically. Where
neither exists yet the fourth page falls back to a career note or a feature photo.

On desktop it renders as a two-page spread with a true 3D page turn. Below 900px it
becomes a single page with swipe navigation. Arrow keys, Home, and End work throughout.

## Deep links and QR codes

Every inductee has a permanent URL:

```
https://jasonsutter87.github.io/gbhs-hall-of-fame/#/taylor-nelson
```

`qr/sheet.html` is a printable page of all 14 QR codes as cut-apart cards — usable as
table tents at the dinner. Open it in a browser and print to letter paper.

The back cover carries the branded Hall of Fame QR code
(`assets/img/ui/qr-hof.png` — the grizzly-crested code, pointing at the site root).
It is a supplied asset, not generated here; leave it in place unless a new one arrives.

**Regenerate the per-inductee QR codes if the URL changes:**

```bash
python build/qr.py https://jasonsutter87.github.io/gbhs-hall-of-fame
```

That rewrites `assets/img/ui/qr-book.png` (the plain fallback code), all of
`qr/*.png`, and the printable sheet.

## Deploying to GitHub Pages

This directory is the site root — publish it as the repository root.

```bash
cd site
git init -b main
git add .
git commit -m "GBHS Sports Hall of Fame — inaugural class"
gh repo create gbhs-hall-of-fame --public --source=. --push
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch →
`main` / `/ (root)`**. The site is live at
`https://<user>.github.io/gbhs-hall-of-fame/` within a minute or two.

Re-run `python build/qr.py <that URL>`, commit, and push so the codes point at the
real address.

## Editing content

Everything readable lives in `assets/js/data.js`. To fix a name, add a retrospective,
or change a highlight, edit that file — nothing else needs to change.

To add a retrospective for someone who doesn't have one, add a `retro` block:

```js
retro: {
  author: "Coach Name", role: "Head Coach, Granite Bay",
  paras: [ "First paragraph…", "Second paragraph…" ]
}
```

A biography is the same shape without the byline:

```js
bio: { paras: [ "First paragraph…", "Second paragraph…" ] }
```

The page types switch automatically. Ryan Loder is the one inductee still
waiting on a bio — drop one in and his fourth page stops being a photo.

### Photo framing

Every photo is cropped to fill its frame, so two fields control how that crop lands:

- `ar` — the six photos' aspect ratios, written by `build/export.py`. Anything
  below 0.95 is treated as upright and gets an upright frame in the gallery;
  the rest get wide frames. Don't hand-edit these; re-run the export instead.
- `focus` — an override for where a crop is anchored, keyed by photo number:

  ```js
  focus: { 1: "50% 10%", 4: "58% 12%" }   // "<x> <y>", a CSS object-position
  ```

  Use it when a centred crop cuts off a head or pushes the subject out of frame.
  A low `y` pulls the frame up toward the top of the photo; a high `x` pushes it
  toward the right edge.

## Replacing photos

`build/picks.json` records which source images were chosen from the original archive,
by folder index. An entry can also be a literal path string instead of an index,
which is how a file renamed since the manifest was built gets picked. The export
also falls back to a basename search under `inductees/` when a manifest path has
moved, so a reorganised archive doesn't break the build. Change the numbers, then:

```bash
python build/sheet.py     # rebuild the numbered contact sheets to pick from
python build/export.py    # re-export the web-sized WebP images
```

`export.py` takes an optional list of slugs to re-export just those inductees:

```bash
python build/export.py caitlin-chock ernie-cooper
```

Run both from the project root (the folder holding `inductees/` and `site/`), not
from inside `site/`. `build/` there is the working copy; `site/build/` is the
published mirror — keep the two in sync.

Both scripts expect the original `inductees/` and `elements/` folders one level up
from the repository — they are deliberately *not* committed here (1.2 GB of raw
photos, video, and PowerShell decks).

## Credits

Program content, nameplates, and the original presentation deck by Rick Sutter.
Photography is from the inductees' personal archives and press coverage of their
careers; several images carry third-party credit and should be cleared before any
commercial or print use.
