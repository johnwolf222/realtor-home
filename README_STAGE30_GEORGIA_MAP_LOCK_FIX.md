# Stage 30 — Georgia Map Lock Fix

This stage improves the dashboard listing map verification flow.

## Changes

- Property map verification now treats listings as Georgia-based by default.
- The address sent to the map lookup automatically appends `Georgia, USA` when needed.
- Map lookup now tries multiple Georgia-focused searches instead of one fragile query.
- Lookup is bounded/biases to Georgia so same-name streets in other states are avoided.
- If the exact street lookup fails, the app now tries a Georgia city/ZIP fallback instead of immediately blocking the listing.
- The dashboard copy now asks for a Georgia street address, city, state, and ZIP.
- If only a city-level fallback is used, the owner gets a warning instead of a false exact-match success.

## Important production note

This is still a prototype/browser-side map lookup. Production should move geocoding into a backend function and use a paid/reliable provider such as Google Maps or Mapbox, especially if accurate GPS lock is business-critical.
