# Stage 18 — Dashboard Verification Photo Review

This stage improves the owner dashboard's Client ID review workflow.

## Added

- Each submitted client verification image can be opened individually.
- The dashboard viewer opens the selected image in a large review modal.
- Each image can be downloaded from the thumbnail card.
- Each image can also be downloaded from the full-size viewer.
- Download file names include the client name and image type:
  - `client-name-front-id-verification.jpg`
  - `client-name-back-id-verification.jpg`
  - `client-name-face-photo-verification.jpg`

## Why

This gives the realtor/owner a practical way to review, save, and print verification information when needed.

## Prototype note

Images are still local browser data in this prototype. Production should store verification images in a secure backend storage bucket with strict owner-only access rules, encryption, audit logs, and clear privacy/retention policies.
