# Mahi’s first birthday invite

A self-contained vanilla HTML, CSS, and JavaScript invitation for **Mahi’s 1st birthday** on **Monday, 5 October 2026** at Icchapurti Banquets, Virar West.

Live site: [https://sahilit.github.io/Mahi-birthday-invite/](https://sahilit.github.io/Mahi-birthday-invite/)

## What’s on the page

- Balloon-pop opening (with a skip control)
- Hero, first-year timeline, and party schedule
- Countdown to the event
- Venue, map (loads on tap), and directions
- Wish wall and RSVP form
- Bottom dock: RSVP, party details, generated music-box audio, and share

Copy, dates, venue, and RSVP wording all live in `js/index.js` as `window.WEDDING`. Layout and page-specific styles are in `index.html` and `css/index.css`. Shared invite behaviour (countdown, map, calendar download, RSVP, music, share) is in `js/kit.js`, `js/wed.js`, and `js/open.js`.

RSVP is local/demo unless you set `rsvp.whatsapp` in `js/index.js` (digits only). Wishes stay in the browser for that visit.

## Run locally

Needs Python 3 (used as a simple static server). From the repo root:

```bash
npm start
```

Then open [http://localhost:4173](http://localhost:4173). You can also run `python3 -m http.server 4173` with no npm.

Open `index.html` as a file if you only want to preview layout; some features (map iframe, share) work better over `http://`.

## Project layout

| Path | Role |
| --- | --- |
| `index.html` | Page structure and opening ritual |
| `js/index.js` | Event content (`WEDDING`) and demo flags |
| `js/kit.js` | Shared helpers (countdown, ICS, music, share) |
| `js/open.js` | Opening animation engine |
| `js/wed.js` | Wires sections from the content object |
| `css/kit.css` | Shared invite stylesheet |
| `css/index.css` | Page-specific styling |
| `images/` | Open Graph / share artwork |

Fonts are [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Nunito](https://fonts.google.com/specimen/Nunito) from Google Fonts.

## Customize

Edit `js/index.js`:

- `basics` — name, age, hosts, date, city, timezone
- `year`, `plan`, `events`, `wishes`, `venue`, `rsvp`, `finale` — section copy
- `rsvp.whatsapp` — host number so submissions can open WhatsApp
- `music.enabled` / `music.preset` — dock music (`musicbox` by default)
- `gate.enabled` — turn the balloon opening on or off

Keep `index.html` meta tags in sync if you change the title, description, or canonical URL.
