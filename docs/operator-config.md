# Operator theme & branding config

One JSON object controls everything that changes from one bus operator to the next: name, logo, colours,
hero banner and the stats strip. The front end reads it once at startup and applies it as CSS variables, so
**one colour change recolours the whole site** (header, buttons, links, icons, gradients, hero overlay, footer).

Code: `src/app/core/operator-config.ts` (everything is in that one file).

## How the front end gets the config (first match wins)

1. `window.__OPERATOR_CONFIG__`: the backend inlines it in `index.html`. **Recommended in production**: no flash of the wrong colours.
   ```html
   <script>window.__OPERATOR_CONFIG__ = {"brand":{"name":"GreenLine"},"colors":{"primary":"#1f9d55"}};</script>
   ```
2. `GET /operator-config.json`: the backend serves this URL per domain/operator (a static file `public/operator-config.json` is shipped as the ODBUS default). 2.5 s timeout.
3. Neither works (404, bad JSON, offline): the ODBUS default is used. The site never breaks because of config.

Anything you leave out falls back to the ODBUS default, so a minimal config is enough:

```json
{ "brand": { "name": "GreenLine" }, "colors": { "primary": "#1f9d55" } }
```

## Fields

| Field | Required | Notes |
|---|---|---|
| `brand.name` | no | Header, footer, headings ("GreenLine Advantage"), settings |
| `brand.legalName` | no | Footer: "© GreenLine (Green Travels Pvt Ltd)" |
| `brand.tagline` | no | Footer one-liner |
| `brand.logoUrl` | no | Image replaces the bus-icon tile in the header (height 34 px) |
| `colors.primary` | **yes** to change the theme | Hex `#rgb` or `#rrggbb`. Buttons, links, icons, highlights |
| `colors.secondary / dark / soft / deep / heroA / heroB` | no | **Derived from `primary` when missing.** Only send them for exact control |
| `colors.desktop` | no | Separate palette for screens >= 1024 px (ODBUS uses its website blue there). Missing = same colours as mobile |
| `hero.image` | no | Wide photo. Desktop 2400x600 (4:1), mobile does not show it. Keep the bottom 15% free of detail |
| `hero.badge / title / highlight / points[]` | no | Headline = `title` + coloured `highlight` |
| `stats[]` | no | `{ "icon": "pin", "value": "2500+", "label": "Routes" }`. Icons: pin, bus, users, help, star |

## Rules the front end enforces (so a bad config cannot ship a broken site)

- **Readable buttons.** White text sits on `primary`. If the colour is too light (contrast below 3:1, e.g. yellow `#f5c400`) it is darkened automatically (to `#b38f00`) and a console warning is logged.
- **Invalid values are ignored** (anything that is not a hex colour), which also blocks CSS injection through the colour fields.
- **Fixed on purpose:** success green, error red, warning orange and the offer-card colours do not follow the brand, so errors never look like buttons.
- **Dark mode** keeps its own dark surfaces; only the soft tint follows the operator hue.

## What the backend should also know

- Server-side rendering renders the ODBUS default first; the operator colours apply when the browser starts. Inline option 1 above to avoid any visible switch.
- Photos: send full URLs or paths under `/photos/...`.
- Demo data (routes, buses, prices, offers, currency) is still mock data in `core/store.ts` and comes from the real booking API later; it is not part of this config.

## Quick test

Change `colors.primary` in `public/operator-config.json` (for example to `#c2185b`) and reload: the whole site recolours.
