# Stage 23 — Clean Profile Photo Editors

This stage cleans up owner and buyer profile photo editing.

## Updates

- Removed the owner profile photo URL / uploaded image data card from the dashboard.
- Owner photo editing now stays in the Public Profile Editor header.
- Owner can upload a photo with the compact Upload owner photo button.
- Uploaded owner photo still updates the public site immediately.
- Buyer account no longer uses a separate Account Photo card or photo URL/data field.
- Buyer photo editing now appears as a compact Upload photo button in the buyer profile header.
- Buyer uploaded photo updates the buyer portal profile immediately.

## Notes

Photo storage is still local browser storage in this prototype. Production should move uploaded images to Supabase Storage or another secure cloud storage service.
