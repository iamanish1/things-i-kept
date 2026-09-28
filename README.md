# Things I Kept

A private, one-person website for a first-month anniversary.
Plain HTML, CSS and JavaScript. No frameworks, no build step, no tracking.

```
/
├── index.html            page skeleton (you shouldn't need to edit this)
├── css/style.css         all styling
├── js/content.js         ✎ EVERYTHING PERSONAL: words, dates, photos, audio
├── js/script.js          behaviour (you shouldn't need to edit this)
└── assets/
    ├── images/
    │   ├── hero/         (spare, for any extra imagery)
    │   ├── memories/     Chapter 02 timeline photos
    │   └── letters/      optional photos inside letters
    ├── audio/            background.mp3 (optional music)
    └── icons/            favicon.svg
```

---

## Run it locally

**Quickest:** double-click `index.html`. Everything works this way.

**Closer to the real thing** (the way it behaves once it is online):

```bash
cd path/to/this/folder
python -m http.server 8000
# then open http://localhost:8000
```

To preview it on your phone, run the command above and open `http://<your-computer's-local-IP>:8000` on a phone connected to the same Wi-Fi.

---

## Before you send it — checklist

1. In `js/content.js`, set **`const DEV_MODE = false;`**
   While it's `true`, the countdown is skipped and the sealed letters can be opened early.
2. Make sure **`DEV_COUNTDOWN_SECONDS = null`**.
3. Check `CONFIG.unlockAt` — `"2026-10-02T00:00:00"` means midnight in *her* phone's time zone.
4. Open the site on your own phone once and read every chapter.

**Rehearse the midnight moment:** set `DEV_COUNTDOWN_SECONDS = 10`, reload, and watch the lock screen count down and open. Set it back to `null` afterwards.

---

## Where to put your things

Everything is in **`js/content.js`**. Search for `✎` to jump between the places to personalise.
Use `\n` for a new line and `\n\n` for a new paragraph.

| What | Where in `content.js` | File location |
|---|---|---|
| Her name (appears once, on the final page) | `CONFIG.girlfriendName` | — |
| Lock screen, welcome and prologue text | `CONFIG` | — |
| Dates shown on screen | `CONFIG.startedOn`, `anniversaryOn`, `anniversaryLabel` | — |
| Your "before" diary page | `beforeYou` | — |
| First-month moments (day, title, text, photo) | `timeline` | `assets/images/memories/day-01.jpg` … |
| Things you notice (10–15 is ideal) | `observations` | — |
| The 12 letters | `letters` | optional: `assets/images/letters/01.jpg` |
| What You Mean To Me — the flowers and their messages | `flowerMessages` (+ words in `whatYouMean`) | — (flowers are drawn in code) |
| If I Could Be There — the hug, banner, poem and last line | `hugChapter` | — (the two figures are drawn in code) |
| Background music (optional, she turns it on) | `CONFIG.backgroundMusic` | `assets/audio/background.mp3` |
| Final page words | `finale` | — |
| The card echo at the end | `keepsake` | — |

### Photos and screenshots
- Put them in `assets/images/memories/` and write the path exactly, e.g. `"assets/images/memories/day-14.jpg"` (no leading `/`).
- Resize to about 1600 px on the long side and keep each one under ~400 KB so it loads quickly on a phone.
- File names are case-sensitive once online: `Day-01.JPG` ≠ `day-01.jpg`.
- **No photo yet?** Leave the path as it is. The site shows *"Some memories don't need a photograph."* in an intentional frame.
  If you'd rather have a text-only card, set `image: null`.

### Letters
- `mood` sets the colour the room turns while she reads: `"rose"`, `"lavender"`, `"candle"`, `"burgundy"` or `"dusk"`.
- `unlockDate: "2026-11-02"` keeps an envelope sealed until that date. Letters 10 and 12 use this.
- Her phone remembers which envelopes she has opened.

### What You Mean To Me (the bouquet)
- Each entry in `flowerMessages` grows one flower, in order, and every flower stays, so the bouquet fills up.
- `type` picks the flower: `"rose"`, `"tulip"`, `"daisy"`, `"lily"`, `"wildflower"` or `"cosmos"`. The optional `color` is one of `"rose"`, `"burgundy"`, `"blush"`, `"cream"` or `"lavender"`.
- Add or remove entries freely; 5–9 flowers looks best.
- The last screen says "Happy One Month" followed by `CONFIG.girlfriendName`, so fill that in.
- Once she has taken the bouquet, her phone remembers it and shows the finished bouquet next time, with a "Grow it again" button.

### If I Could Be There (the hug)
- Every word is in `hugChapter`: the intro, button, banner, `poem` (one item per verse) and `finalLine`.
- The two silhouettes are SVG shapes in `js/script.js` under **"The hug · figures"**. Their arm and head positions for each moment are in `css/style.css` under **"The hug · poses"**.
- While the scene plays, the chapter navigation hides. When it ends, a quiet Continue link and a "Once more" button appear.
- Her phone remembers that she's seen it, and next time opens straight to the embrace.

### Our Future
Her three answers are saved **only on her phone** (browser storage). Nothing is sent anywhere.
After saving, she gets a **"Send them to me"** button that opens her phone's share sheet (or copies the text), so she can choose to send them to you.

---

## The QR card

Make the QR code point to your site's address with `?from=card` on the end:

```
https://your-site-address/?from=card
```

When she arrives that way, the site greets her with *"You found the secret door."*, or *"You found it early."* if she scans it before midnight.

To make the QR code without sending your URL to a random website, open the site in **Chrome → Share → QR code** (desktop or Android). It's generated on your device, and you can download the image and print it on the card.

---

## Deploy (free, static hosting)

Any static host works. Upload the whole folder as it is.

**Netlify Drop (easiest, about 1 minute)**
1. Go to <https://app.netlify.com/drop>
2. Drag this whole folder onto the page.
3. You get a URL like `https://random-name.netlify.app`. Rename it under *Site settings → Domain*.
4. To update later, drag the folder onto *Deploys* again.

**Cloudflare Pages**: *Workers & Pages → Create → Pages → Upload assets*, then drop the folder.

**GitHub Pages**: push to a repository, then enable *Settings → Pages → Deploy from branch*. Note that on a free account the repository (and so all your letters) must be **public**. Netlify or Cloudflare are better for something this personal.

### Privacy notes
- The page asks search engines not to index it (`noindex`), and there are no analytics or trackers.
- The only third-party request is Google Fonts. To remove it, delete the three font `<link>` lines in `index.html`. The site falls back to Georgia and system fonts.
- Anyone who has the link can open it. Choose an address that isn't easy to guess.

---

## Moving through the story
The site shows one page at a time: welcome → prologue → Our Story → the seven chapters → the last page.
She can move between pages with the Continue / Back links at the bottom of each chapter, the chapter rail (top on desktop, bottom pill on phones), a left/right swipe on her phone, the ← → keys, or the phone's back button.
Long chapters scroll normally within their page.

## Accessibility and motion
- Works with keyboard only: Tab, Enter, ← → between pages (and between days on the timeline), and Esc closes a letter.
- If her phone has *Reduce Motion* turned on, animations are replaced by simple fades.
- Music and sound never start by themselves.
