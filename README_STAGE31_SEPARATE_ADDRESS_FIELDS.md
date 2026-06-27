# Stage 31 — Separate Georgia Address Fields

This stage makes the dashboard listing form easier to understand and improves Georgia-first map locking.

## Changes

- Replaced the single `City / State / ZIP` field with separate fields:
  - Street address
  - City
  - State
  - ZIP code
- State is limited to `GA` for the current Georgia-based demo.
- Map verification now builds a structured Georgia address from those separate fields.
- Geocoding tries:
  1. Structured street + city + state + ZIP
  2. Full Georgia address search
  3. ZIP-level Georgia fallback
  4. City-level Georgia fallback
  5. Expanded Georgia search
- New dashboard listings save the city display as `City, GA ZIP`.
- Seed/demo properties were shifted from California sample locations to Georgia sample locations.
- The local property storage key was bumped so the Georgia seed listings show cleanly during testing.

## Production note

You do not need a Zillow API just to place a pin on the map. For final production, use a dedicated geocoding provider such as Google Maps or Mapbox, ideally through a backend function. Zillow/MLS/IDX is a separate concern for property data, valuation, or listing feed workflows.
