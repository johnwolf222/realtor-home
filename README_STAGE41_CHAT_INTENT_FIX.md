# Stage 41 — Chat Intent Fix

This update fixes the AI concierge behavior when users send greetings or general low-intent messages such as "hello".

## Changes
- Adds a dedicated greeting intent.
- Stops the AI from forcing a property pitch/card when the user only says hello.
- Removes duplicated "Tell me what matters..." wording.
- Keeps property cards for actual property/search/tour requests only.
- Keeps smart action buttons available without sounding robotic.

## Why
The previous chat treated general greetings as property questions, which made the response feel unnatural and overly sales-heavy.
