# Stage 7 — Functionality Cleanup Pass

This stage turns the strongest visible buyer/owner buttons from mock-only UI into local working flows.

## Newly wired flows

- Property card **Tour** buttons now carry the selected property into `/tours`.
- Property page **Schedule a Tour** now carries the selected property into `/tours`.
- Property page **Instant Chat** now carries the selected property into `/chat`.
- Property page **Documents** now opens the chat/document flow for that property.
- Property page **Video Tour** now opens a video-tour request flow for that property.
- Desktop property gallery thumbnails now switch the large photo.
- Tour requests now save into local dashboard state instead of only showing a toast.
- New tour requests appear in the dashboard Tours tab.
- Dashboard **Confirm tour** now changes the tour status to Confirmed.
- Chat lead capture now creates a dashboard lead and a dashboard chat thread.
- Chat messages now persist to localStorage and appear in the dashboard Chat tab.
- Document uploads now add a document message into the dashboard chat thread.
- Video call requests now add a dashboard update/chat event instead of only showing a fake success toast.
- Dashboard profile save now updates the public profile/header/homepage locally.
- Dashboard notification feed now shows recent local activity.
- Dashboard Add Listing now opens a simple working draft form and stores dashboard listing drafts locally.

## Still frontend-only

This is still a prototype/local data layer. It does not yet send real emails, store real documents, authenticate with a backend, connect MLS/IDX, create Zoom meetings, or process e-signatures.

## Next production step

Connect Supabase for:

- Auth
- Owner role security
- Database-backed leads/tours/chats/listings
- File storage
- Email notifications
- Row Level Security

