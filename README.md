# Aarya Invite Clone

A self-contained vanilla HTML/CSS/JS recreation of the public Dil Se Invite “Aarya turns One!” demo at `https://dilseinvite.in/demo/aarya-turns-1/`.

## Run locally

```bash
npm run dev
```

Then open [http://localhost:4173](http://localhost:4173).

## Reference inspection

The original page was inspected for its rendered structure and behavior. It uses:

- page-level inline styles plus `demo/_kit/kit.css`
- `demo/_kit/kit.js`, `open.js`, and `wed.js`
- Fredoka and Nunito fonts
- a balloon-opening gate, countdown, wish form, map action, RSVP form, music control, share control, and calendar download

This repo intentionally keeps the implementation local and dependency-free; names and event details can be edited directly in `index.html` and `script.js`.
