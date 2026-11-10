# Backend integration guide (front end handover)

The front end is finished as a design: every screen works with sample data. This page tells the backend developer
**what data each screen needs and where to plug it in**, so nothing has to be rebuilt.

## The one rule

Every screen reads its data from a single place: `src/app/core/store.ts` (class `Store`).
Components never hold data of their own. To go live, replace a field's sample value with data from your API.
The templates and styles do not change.

Branding, colours, hero and the stats strip are separate and already API-ready: see `docs/operator-config.md`.

## Home page: data needed

| Section on Home | `Store` field | Type | Suggested endpoint |
|---|---|---|---|
| Brand, colours, hero, stats strip | `OperatorConfigService` | `OperatorConfig` | `GET /operator-config.json` (per domain), see `operator-config.md` |
| From / To drop-downs | `cities` | `string[]` | `GET /api/cities` |
| Recent searches (3 shown) | `recent` | `RecentSearch[]` | `GET /api/me/recent-searches` (guests: keep in `localStorage`) |
| Offers for you (slider) | `offers` | `Offer[]` | `GET /api/offers` |
| Offer code check at checkout | `PROMOS` (const) + `applyPromo()` | `Promo` | `POST /api/promo/validate` |
| Popular destinations (photo cards) | `popularRoutes` | `RouteInfo[]` | `GET /api/routes/popular` |
| Popular routes (price cards) | `topRoutes` | `RouteInfo[]` | `GET /api/routes/top` |
| Bus listing after Search | `buses` (computed from `routeInfo`) | `Bus[]` | `GET /api/buses?from=&to=&date=&passengers=` |

## Shapes (copy these into your API responses)

```ts
// Recent search: dates are ISO "YYYY-MM-DD"
interface RecentSearch { from: string; to: string; date: string; passengers: number }

// Offer card + checkout. `code` must exist in your promo system.
interface Offer { code: string; title: string; desc: string; badge: string; note: string; icon: string }
// icon is one of: ticket gift moon star calendar users zap card (see shared/icon/icon.ts for all names)

// Used by both Popular destinations and Popular routes
interface RouteInfo {
  from: string; to: string;
  price: number;        // numeric, no symbol
  duration: string;     // display text, e.g. "2h 00m"
  cur?: string;         // currency symbol, default "$" (use "₹" for India)
  img?: string;         // photo URL; only the Popular destinations cards use it
  tag?: string;         // optional grouping label
}

interface Bus {
  id: number; operator: string; type: string;
  depart: string; arrive: string; duration: string; minutes: number;
  price: number; rating: number; seatsLeft: number; amenities: string[];
  offer?: { title: string; code: string; desc: string };   // shows the orange tag on the listing card
}
```

Example `GET /api/routes/top`:

```json
[
  { "from": "Bhubaneswar", "to": "Puri", "price": 180, "duration": "2h 00m", "cur": "₹" },
  { "from": "Bhubaneswar", "to": "Cuttack", "price": 80, "duration": "0h 45m", "cur": "₹" }
]
```

## Rules the screens already follow (keep your data consistent with them)

- **Dates** are ISO `YYYY-MM-DD`. A recent search with a past date is moved to today when the user taps it.
- **Prices** are plain numbers; the symbol comes from `cur`. Currency is not hard-wired in the layout.
- **Empty lists are fine.** Recent searches hides the whole section when empty. Offers, routes and destinations simply show no cards.
- **Any number of items works.** Offers, Popular destinations and Popular routes are sliders (arrows on desktop, swipe on mobile). Recent searches shows the latest 3.
- **Missing photo:** a destination card without `img` shows a coloured gradient instead.
- **City names** in routes must match names returned by `cities`, because tapping a card fills the search form with them.
- **No service on a route/day:** the listing uses `hasService()` in `store.ts` to show the "no buses" page. Replace it with the API's empty result.

## Where things live

| What | File |
|---|---|
| All sample data and app state | `src/app/core/store.ts` |
| Brand, theme, hero, stats loader | `src/app/core/operator-config.ts` |
| Brand colour tokens (one place) | `src/styles.scss` (top) and the config |
| Home page | `src/app/pages/home/` |
| Offers slider, coupon pop-up, search form | `src/app/shared/` |
| Header, footer, mobile tab bar | `src/app/layout/shell/` |

## Known placeholders to replace before launch

- Stats strip figures (2500+ routes, 2200+ buses, 10 Lakh+ customers, 4.5 rating): in the config.
- All sample data in `store.ts`: cities, buses, offers, routes, recent searches, bookings, reviews, notifications. The US sample cities (New York, Boston and so on) can be deleted once the API returns real ones.
- Some offers still show `$` amounts in their text; use your own wording and currency.
- "View all" under Popular routes opens the Search page. There is no "All routes" page yet.
- Hero photo and route photos in `public/photos/`: replace with the operator's own (hero 2400x600).

## Suggested next step for the developer

Add one small service (for example `core/api.ts`) that fetches the lists above and fills the matching `Store` fields at
startup, the same way `OperatorConfigService.load()` fills the theme. Keep `Store` as the only thing the screens
talk to, so the design never has to be touched again.
