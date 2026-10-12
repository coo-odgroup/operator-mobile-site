# BusGo Mobile (Angular 22)

Mobile-first bus-booking site built from the 14 design screens. Standalone components, signals, zoneless, lazy-loaded routes. Needs **Node 22.22.3+ or 24.15+** (Angular 22 requirement).

```bash
npm install
npm start          # http://localhost:4200
npm run build      # dist/busgo-mobile/browser
npm test
```

## Pages

| Route | Screen in the design |
|---|---|
| `/home` | Home Page - Find Your Bus, Popular Routes, Recent Searches, Special Offers |
| `/search` | Search Section - Find Your Trip, Recent Searches, Popular Destinations |
| `/bookings` | My Bookings - Upcoming Trips, Quick Actions (the "My Tickets" tab) |
| `/offers` | Offers & Rewards - points, offers, referral, rewards, promo code |
| `/settings` | Settings (labelled "Profile Section") |
| `/profile` | Profile / Edit Profile - tap **Edit** to edit in place |
| side bar | Drawer menu (hamburger icon) |

Pages named in the side bar that were not drawn in the screenshot, built to complete the booking flow:
`/buses` -> `/bus-details` -> `/seats` -> `/verification` -> `/checkout` -> `/success`, plus `/tickets`, `/history`, `/saved`.

## Folder structure

Every component lives in its own folder with a separate `.ts` (logic), `.html` (template) and `.scss` (styles) file.

```
src/
  styles.scss                  global design tokens + shared classes (.card, .btn, .chip ...)
  app/
    app.ts / app.html          root component (router outlet)
    app.routes.ts              all routes (lazy loaded)
    app.config.ts
    core/store.ts              shared state + sample data
    layout/shell/              header, bottom tabs, side drawer   (shell.ts / .html / .scss)
    shared/icon/               <app-icon>                          (icon.ts / .html)
    shared/search-form/        trip search card                    (search-form.ts / .html)
    shared/offer-card/         offer card                          (offer-card.ts / .html / .scss)
    pages/<name>/              one folder per page: home, search, bookings, offers,
                               settings, profile, bus-listing, bus-details, select-seat,
                               verification, checkout, payment-success, tickets,
                               trip-history, saved-routes
```

## Where to change things

- Brand name: `BRAND` in `src/app/core/store.ts`
- Colors / spacing: CSS variables at the top of `src/styles.scss` (dark theme included)
- Sample data (routes, buses, offers, bookings, profile): `src/app/core/store.ts` - replace the signals with API calls
- Header/tabs/drawer: `src/app/layout/shell.ts`

## Prototype placeholders (wire before launch)

- All data is in-memory sample data; nothing persists on reload.
- Verification accepts any 4 digits; payment does not call a gateway; card fields are not read.
- The ticket QR is decorative, not scannable.
- Security, Payment Methods, Language, Help, Terms, Privacy rows show a toast only.
