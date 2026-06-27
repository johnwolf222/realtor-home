# Stage 12 — Custom AI Concierge Control Center

This stage keeps the buyer chat native to the realtor platform instead of using Botpress or an outside widget.

## New owner dashboard tab

A new **AI Agent** tab was added to the owner dashboard.

The owner can now edit:

- AI concierge name
- AI tone
- Service-area context
- Buyer-facing welcome message
- Auto-reply on/off
- Owner handoff alerts on/off
- Handoff score threshold
- Financial/payment disclaimer
- Fair housing/location guardrail note
- Owner handoff message

## Chat behavior upgrades

The buyer chat now reads the dashboard AI settings live.

Examples:

- If the owner changes the AI name, chat updates to that name.
- If auto-reply is off, buyer messages save and the owner dashboard is alerted instead of sending an AI response.
- If a buyer shows high intent, uploads documents, asks for a tour, asks about offers, or requests video, the owner dashboard receives a handoff notification.
- The AI response now uses the configured service area, tone, financial disclaimer, and fair-housing-safe location note.

## Still local prototype storage

This is still using local browser storage. Production should connect:

- Supabase Auth
- Supabase database tables
- Supabase Storage for documents/images
- Server-side AI API calls
- Real email/SMS notifications
- Real owner roles and Row Level Security

