# Stage 9 — Live Dashboard + Editable Platform Data

This stage turns the owner dashboard into a functional local command center.

## What changed

- Dashboard listings are now editable and reflected on the public website.
- Added full add/edit/delete listing flow.
- Listings can be marked active or sold.
- Newly added listings appear on `/listings`, `/property/:id`, saved homes, tours, and chat selectors.
- Profile edits update the public homepage immediately.
- Homepage stats and social links are editable.
- Leads can be status-updated or removed.
- Tour requests can be confirmed, edited, switched between in-person/video, rescheduled, or removed.
- Chat threads can be opened, marked read, replied to as the realtor, or removed.
- Dashboard updates feed tracks listing, lead, tour, chat, video, document, profile, and system events.
- Security tab can change owner password, update notification email, lock the session, or reset local demo data.

## Current storage model

This is still a frontend/local prototype using localStorage and sessionStorage.
It behaves like live data in the browser and across tabs, but it is not production security or cloud storage yet.

## Next production step

Move localStorage data into Supabase:

- profiles
- properties
- leads
- tour_requests
- chat_threads
- chat_messages
- dashboard_notifications
- owner_settings
- storage buckets for images/documents

Then apply Supabase Auth + Row Level Security so the owner dashboard is protected server-side.
