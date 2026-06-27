# Stage 28 — Address Verification / Map Lock

This stage adds map verification for dashboard-added and dashboard-edited listings.

## What changed

- The dashboard listing form now includes an **Address Verification / Map Lock** section.
- The owner can select **Verify map location** to geocode the typed address into latitude/longitude coordinates.
- If the owner saves without verifying first, the app attempts to verify the map automatically before publishing.
- Once verified, the form shows a live map preview and locked latitude/longitude.
- New and edited listings save the locked coordinates so the public property detail page map points to the correct location.
- Editing the address or city/state/ZIP clears the old map lock so the owner must verify the new location.
- Dashboard listing cards now show a **Map locked** indicator.

## Prototype note

This build uses a client-side OpenStreetMap/Nominatim geocoding request for prototype testing. Production should use a controlled backend geocoding function or a paid provider such as Google Maps or Mapbox to improve reliability, rate limits, and address accuracy.
