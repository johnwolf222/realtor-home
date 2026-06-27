# Stage 15 — Verification Attention + Timed Prompt

This stage focuses on making client verification more visible and guiding serious buyers into the verification flow.

## Added

- The Buyer Portal Client ID Verification card now uses the site navy/primary color to draw important attention.
- The verification card keeps the Government ID-only and camera-only three-photo flow:
  - front of ID
  - back of ID
  - forward-facing face picture
- Added a global verification prompt that appears after a visitor has been online for 5 minutes.

## Timed prompt rules

The popup only appears when:

- the visitor has been in the session for at least 5 minutes
- the visitor is not already verified
- the visitor does not already have a pending verification submission
- the visitor is not inside auth pages, the buyer portal, onboarding, or the owner dashboard
- the popup has not already been dismissed during the current browser session

## Get Started routing

- If the visitor is not logged in, **Get Started** sends them to `/register`.
- A secondary **Sign In First** button sends them to `/login`.
- If the visitor is logged in but unverified, **Get Started** sends them to `/account` where the verification card lives.

## Prototype limitation

The 5-minute timer, dismissal state, and verification data are currently stored locally in the browser/session. Production should move verification status, ID photo storage, and reminder rules into Supabase/server-backed logic.
