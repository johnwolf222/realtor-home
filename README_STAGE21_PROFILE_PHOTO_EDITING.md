# Stage 21 — Owner + Buyer Profile Photo Editing

## Owner/Realtor photo editing

The owner dashboard Profile tab now has a clearer owner photo editor.

- Upload an owner/realtor photo from the dashboard.
- Paste an owner/realtor photo URL.
- Use the Update site photo button to push the photo live.
- Reset the photo back to the default seed headshot.
- The public site updates from the owner profile photo, including the header/profile areas that read from the live realtor profile store.

This is still local browser storage for the prototype. Production should use Supabase Storage or another secure image storage service.

## Buyer account photo editing

The Buyer Portal now includes an Account Photo card.

- Buyers can upload an account photo.
- Buyers can paste an account photo URL.
- Buyers can remove the account photo and return to initials.
- The buyer portal sidebar updates immediately.

This buyer photo is stored in the mock auth user in localStorage until backend auth/storage is connected.
