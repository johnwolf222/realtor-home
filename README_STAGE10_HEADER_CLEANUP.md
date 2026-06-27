# Stage 10 - Header Account Button Cleanup

This stage removes the duplicate standalone account icon from the public header.

## Changed

- Removed the far-right solo account icon button from `src/components/AppShell.tsx`.
- Kept one clear account action only:
  - `Buyer Login` when signed out.
  - `Buyer Portal` when signed in.
- The hidden owner dashboard icon on the realtor profile remains unchanged.
- Buyer account access is now represented by a single header button instead of two duplicate controls.
