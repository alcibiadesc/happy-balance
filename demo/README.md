# happy-balance — static demo

A self-contained, **pure static** showcase of the [happy-balance](https://github.com/alcibiadesc/happy-balance)
personal-finance app. It lets people see how the app feels — with invented
placeholder data — before spinning up the real Docker stack.

There is **no build step, no backend, no `npm install`**. A static host serves
this `demo/` directory directly.

## Contents

| File | Purpose |
| --- | --- |
| `index.html` | The single-page demo (hero, dashboard, transactions, Tinder mode, features, footer). |
| `styles.css` | Standalone styles mirroring the app's "japan palette" (teal `#023c46`, acapulco `#7abaa5`, froly `#f5796c`, sunglow `#fecd2c`). |
| `app.js` | Vanilla JS for the interactive Tinder mode (drag via Pointer Events + Accept/Skip buttons). |

## What it shows

- **Dashboard snapshot** — balance, income vs expense bars, top-category breakdown (CSS bars, no chart libs).
- **Transactions list** — color-coded income / expense / investment badges with emoji category icons.
- **Tinder mode (headline)** — drag or tap a card to accept/skip a suggested category; cards tilt while dragging and show green "accept" / coral "skip" overlays, ending in a "done" state.
- **Shared-expense mode** — a second card type linking an income from a partner ("Isa") to an expense at a 50% split, demoing automatic reimbursement detection.
- **Feature list + footer** noting it is a demo with placeholder data.

All data is fake. No network calls are made (system fonts only).

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
# from the repo root
python3 -m http.server -d demo 8080
# then visit http://localhost:8080
```

## Deploy to Cloudflare Pages

```bash
wrangler pages deploy demo --project-name=happy-balance-demo
```

Intended to live at `alci.es/tools`.
