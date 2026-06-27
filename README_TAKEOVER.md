# Realtor Profile Platform — Takeover Notes

This project was exported from Lovable and cleaned for local ownership.

## What this app is

A premium realtor sales platform prototype with:

- Realtor profile/homepage
- Active listings
- Saved/liked homes
- Property detail pages
- Sold homes
- Tour requests
- Buyer chat and lead capture
- Realtor dashboard
- Sample data in `src/lib/data.ts`

## Current stack

- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Router / TanStack Start
- Radix UI components
- Sonner toasts
- Local mock data only right now

## First local run

```bash
cd realtor-profile
npm install
npm run dev
```

Then open the local URL shown in Terminal.

## Important takeover notes

1. The app is mostly yours now, but `vite.config.ts` still uses `@lovable.dev/vite-tanstack-config`.
2. That dependency is a build helper, not the hosted Lovable site. The app can still be developed locally.
3. The next clean-up step is replacing `vite.config.ts` with a standard TanStack Start + Vite config.
4. Data is currently hard-coded in `src/lib/data.ts`. The first real backend step should be Supabase tables for realtors, properties, leads, tours, chats, saved homes, and documents.
5. Dashboard edits currently use local form state/toasts. They do not persist to a database yet.
6. Chat, document upload, Zoom/video, and signing are UI placeholders right now.

## Files worth knowing first

- `src/lib/data.ts` — all demo realtor, property, lead, tour, and chat data
- `src/components/AppShell.tsx` — top header + page wrapper
- `src/components/BottomNav.tsx` — mobile bottom navigation
- `src/components/PropertyCard.tsx` — reusable listing card
- `src/routes/index.tsx` — homepage/profile
- `src/routes/listings.tsx` — searchable/filterable listings
- `src/routes/property.$id.tsx` — property detail page
- `src/routes/chat.tsx` — lead capture + chat UI
- `src/routes/tours.tsx` — tour request flow
- `src/routes/dashboard.tsx` — realtor dashboard

## Recommended next build order

1. Run locally and confirm the app opens.
2. Remove remaining Lovable build dependency safely.
3. Replace demo text/photos with a neutral white-label brand setup.
4. Improve UI structure page by page.
5. Add Supabase.
6. Build real CRUD for properties and profile data.
7. Add auth: realtor login first, buyer login later.
8. Add persistent leads/tour requests/chat.
9. Add document upload.
10. Add video/signing integrations.
