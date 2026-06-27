# Stage 2 — Responsive Website UI Upgrade

This version upgrades the prototype from a narrow mobile-style layout into a more polished, responsive realtor website/platform.

## What changed

- Wider desktop-first layout using `max-w-7xl` sections
- Responsive grids for homepage, listings, sold homes, dashboard, tours, chat, and property pages
- Desktop top navigation and mobile bottom navigation
- Floating chat button
- Premium homepage hero with realtor trust info, featured listing, stats, and buyer CTAs
- Cleaner property cards with bigger photos, stronger price hierarchy, save buttons, and tour buttons
- Listings page with desktop sidebar filters and responsive property grid
- Property detail page with desktop image gallery, sticky realtor action card, map, facts, and similar homes
- Chat page upgraded into lead capture + real chat workspace
- Tour page upgraded into a two-column appointment experience
- Saved homes and dashboard upgraded for desktop and mobile
- Shared global UI helpers in `src/styles.css`: `.social-pill`, `.section-kicker`, `.filter-label`, `.ev-input`, `.hero-surface`

## Run locally

```bash
cd realtor-profile
npm install
npm run dev
```

## Notes

The remaining Lovable Vite config dependency was intentionally left alone in this stage to avoid breaking the build. The next ownership step is to replace the Lovable TanStack Vite config with a standard TanStack Start configuration.
