# Stage 36 — Lead Capture + Dashboard Lead Storage

This stage adds a homepage private buyer/member intake form that saves qualified leads into the owner dashboard and creates a matching chat thread for follow-up.

## Added

- Homepage “Private Buyer Intake” conversion section
- Member lead form with name, email, phone, timeline, budget, interest, and message
- New dashboard lead fields for source and note
- Lead note copied into the matching chat thread
- Dashboard lead detail card now shows Source + Lead note

## Important prototype note

This version stores data in browser localStorage like the rest of the current prototype. It is good for demo/testing in the same browser. The next production step is connecting this same flow to Supabase so leads submitted by visitors appear in the owner dashboard across devices.

## Next planned stage

Owner dashboard chat AI suggestions: suggested replies for customer messages so the owner can respond faster and more professionally.
