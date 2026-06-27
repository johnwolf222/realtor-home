# Stage 22 — Account Photo Icon Cleanup

This stage cleans up the buyer portal profile photo editor.

## Changes

- Removed the separate buyer `Account photo` card from the account page.
- Added the upload control as a small icon on the bottom-right corner of the buyer profile photo.
- The icon opens the image upload picker directly.
- Uploaded account photos still update the buyer portal profile immediately.
- The owner/realtor dashboard photo editing flow remains separate and still controls the public realtor site photo.

## Notes

This is still local prototype storage. Production should move profile images into secure cloud storage, such as Supabase Storage, and save only the file URL/path in the database.
