# Stage 27 — Member Language + Final Draft Readiness

This stage changes the public account language from **Buyer** to **Member** across the app where it applies to user accounts, portal access, chat, saved homes, verification, onboarding, and dashboard lead management.

## Changed language

- Buyer Login → Member Login
- Buyer Portal → Member Portal
- Buyer Registration → Member Registration
- Buyer details → Member details
- Buyer Favorites → Member Favorites
- Buyer Pipeline → Member Pipeline
- AI Buyer Concierge → AI Member Concierge
- buyer account / buyer portal / buyer messages → member account / member portal / member messages

## Preserved real-estate transaction language

The sold-home representation field still uses **Buyer** and **Seller** where it refers to real estate transaction representation, because that is industry language and should not become “Member/Seller.”

## Compatibility

The auth reader includes a local migration so older prototype sessions saved as `buyer` are normalized to `member` when loaded.

## Final proposal readiness

This version is now appropriate to present as a polished final-draft prototype. The next completion steps are backend-focused:

1. Supabase Auth
2. Supabase database tables
3. Supabase Storage for photos and ID captures
4. Owner-only secure dashboard rules
5. Real email notifications
6. OpenAI-powered concierge endpoint
7. Deployment to a custom domain
