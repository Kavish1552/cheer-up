# 🐨 Operation: Keep Khushi Khush

A tiny, hand-made website that turns giving a koala soft toy into an official,
un-refusable **adoption ceremony** — built to cheer up one very specific person.

**Live site:** https://kavish1552.github.io/cheer-up/

## What happens on the site

1. **The Delivery** — a wobbling parcel addressed to Khushi (only).
2. **The Reveal** — an animated koala introduces itself and applies for the
   position of Best Friend (permanent, unpaid, paid in hugs).
3. **The Un-refusable Offer** — the "no" button runs away, shrinks, pleads,
   and eventually surrenders. Saying yes is the only outcome.
4. **Naming Ceremony** — she names the koala; the name is remembered forever
   (in her browser's localStorage).
5. **Certificate of Best-Friendship** — official, printable, gloriously silly.
6. **Companion Home** — the permanent page: a leaf-catching game where she
   slides the koala to catch falling leaves, hearts and stars, and the koala
   compliments her as she plays (missing a leaf just earns a reassurance that
   the koala isn't going anywhere — losing is not implemented). Plus an
   emergency hug button (a full-screen embrace with wrapping arms and
   floating hearts) and a koala dance button (disco lights, music notes,
   the forbidden koala shuffle).

Pure static HTML/CSS/JS. No build step, no dependencies, no tracking.

## Before publishing

1. **Add the photo:** save the photo of the real koala toy as
   [`assets/koala.jpg`](assets/koala.jpg). (If it's missing, the site still
   works — the photo frames just hide themselves.)
2. Commit and push to `main`.
3. On GitHub: **Settings → Pages → Source: "Deploy from a branch" →
   Branch: `main` / `/ (root)`** → Save.
4. Wait a minute, then open https://kavish1552.github.io/cheer-up/

## Run locally

Open `index.html` directly, or serve the folder:

```
python -m http.server
```

then visit http://localhost:8000

To replay the story after adopting: use the "↺ replay our story" link at the
bottom, or clear the site's localStorage.
