# Stage 39 — Smart Chat Action Cards

This stage upgrades the member AI chat from text-only replies into an action-oriented concierge experience.

## Added

- Property suggestion cards inside chat when members ask for homes by price, bedrooms, location, type, or availability.
- Clickable property cards with quick `View` and `Tour` actions.
- Filtered listing links from AI answers, such as `/listings?maxPrice=2000000&beds=4`.
- Schedule private tour and video tour buttons inside AI replies.
- Contact action card with active realtor phone/email from the dashboard profile.
- Account verification action card:
  - Logged-in users are sent to `/account#client-verification`.
  - Logged-out users are sent to sign in or create an account.
- Document upload action from AI replies.
- Chat messages now support optional structured action payloads.
- Listings page now reads query parameters for AI-filtered links.

## Customer-facing safety

The chat no longer exposes internal terms such as lead score, dashboard routing, handoff triggers, or internal AI logic. Action cards guide the user without revealing the system behind the scenes.

## Good test prompts

Try these in the member chat:

- `Show me homes under $2M`
- `Show me 4 bedroom homes under $5M`
- `Can I schedule a private tour?`
- `Can we do a video tour?`
- `How do I contact Elena?`
- `How do I verify my account?`
- `Compare this with similar homes`

## Notes

This remains prototype/local-storage based. In production, property search, lead routing, verification, chat persistence, and contact tracking should be backed by Supabase and server-side APIs.
