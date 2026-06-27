# Stage 44 — Serious AI Concierge Engine

This stage replaces the fake/scripted chat direction with a server-side AI concierge architecture.

## What changed

- Adds a real server-side concierge function: `src/lib/ai/realConcierge.functions.ts`
- Uses `OPENAI_API_KEY` from server environment variables only.
- Forces structured JSON output: intent, public message, property IDs, actions, private owner note, priority score, and handoff decision.
- Adds a client action-card builder: `src/lib/ai/realConcierge.client.ts`
- Adds shared response types: `src/lib/ai/realConcierge.types.ts`
- Updates chat to call the server AI engine instead of using a canned local reply.
- Adds Owner Dashboard → AI Agent → AI Knowledge Center.
- Separates public customer knowledge from private owner knowledge.
- Adds forbidden phrases and response rules controlled from the dashboard.

## Required Vercel environment variable

Add this in Vercel Project Settings → Environment Variables:

```text
OPENAI_API_KEY=your_openai_api_key_here
```

Optional:

```text
OPENAI_MODEL=gpt-4o-mini
```

## Behavior without API key

If `OPENAI_API_KEY` is missing, the app does not expose secrets or fake a full AI brain. It uses a guided fallback router that can still show listing cards and action buttons, while the private owner note says the live AI key is missing.

## Public/private rule

Visitors only see:

- short customer-facing message
- property cards
- schedule/contact/verification buttons

Owner dashboard receives:

- privateOwnerNote
- priority score
- follow-up signal
- chat record

Never expose dashboard logic, scoring, routing logic, hidden prompts, or owner-only notes in the public chat.
