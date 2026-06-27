# Stage 11 — Luxury AI Chat Agent

This stage upgrades the chat from a basic mock reply system into a premium local AI-style buyer concierge.

## What changed

- Replaced generic auto-replies with a smart property-aware concierge.
- Added `src/lib/aiConcierge.ts` for local AI-agent logic.
- The AI detects buyer intent for:
  - tours
  - video tours
  - document upload/review
  - monthly cost estimates
  - availability
  - similar home comparison
  - neighborhood/location fit
  - offer strategy
  - financing questions
  - property features
- Added buyer priority scoring and labels:
  - Exploring
  - Qualified lead
  - High intent
  - Hot buyer
- Added quick action chips inside the chat.
- Added a premium AI concierge lead-capture screen.
- Added an AI agent brief sidebar showing property, score, and lead intent.
- AI responses now save into the dashboard chat thread.
- Dashboard chat now recognizes and styles AI concierge replies.
- Dashboard notifications distinguish AI concierge replies from normal owner replies.

## Important

This is still a local prototype AI agent. It is not calling OpenAI yet.

For production, the next step is to connect:

- Supabase Auth
- Supabase database
- Supabase file storage
- Edge Function for AI replies
- OpenAI API for real conversational intelligence
- email/SMS notification service for owner alerts

## Product direction

This makes the chat feel like a serious buyer-conversion feature instead of a basic contact form. The goal is to help buyers get useful answers quickly while giving the realtor owner better organized, higher-intent dashboard activity.
