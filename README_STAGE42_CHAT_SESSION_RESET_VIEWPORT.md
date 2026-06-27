# Stage 42 — Chat Session Reset + Fixed Chat Viewport

## What changed

- Customer-facing chat now ends after 5 minutes of idle time.
- When the session times out, the visitor sees a clean timeout message and a Start a New Chat button.
- Starting a new chat resets the visible customer chat window so old messages are no longer shown to the visitor.
- Dashboard chat history is still preserved under the same account/thread card.
- New messages after the reset continue to append to the same dashboard conversation.
- Chat layout now uses a fixed viewport with an internal scroll area so the chat box does not grow longer with every message.

## Important behavior

The UI clears the visible customer session. It does not delete dashboard records. This keeps the member experience clean while keeping owner-side context available.

## Main files touched

- `src/routes/chat.tsx`
- `src/lib/data.ts`
- `src/lib/platformStore.ts`
