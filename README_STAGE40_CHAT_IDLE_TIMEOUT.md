# Stage 40 — Chat Idle Timeout

Adds a customer-facing chat session timeout while preserving the dashboard conversation history under the same member/account thread.

## Added

- Chat session automatically ends after 5 minutes of inactivity from the last message activity.
- Timeout message appears in the chat:
  - "This session has timed out. If there is something I can help with, please leave a message at any time."
- Composer is replaced with a clean “Start a New Chat” action when the session is timed out.
- Starting a new session keeps the same dashboard/account conversation card and appends a “New chat session started.” divider.
- Timeout/session divider messages are shown as centered system notices in both the member chat and owner dashboard chat view.
- Timeout events do not create unnecessary owner notifications.

## Notes

This is still local/browser-storage behavior for the demo. In production, the same logic should be mirrored in Supabase so chat session timestamps persist across devices and browsers.
