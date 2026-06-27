# Stage 25 — Working Call Buttons

This stage wires the public call actions into real phone links.

## What changed

- Added a contact helper at `src/lib/contact.ts`.
- Public call buttons now use sanitized `tel:` links instead of raw phone text.
- Homepage `Call` button opens the device phone handler using the realtor phone number from the dashboard profile.
- Property detail `Call Realtor` button opens the same live phone handler.
- If the owner removes the phone number in Dashboard → Profile, call buttons become disabled instead of opening a broken link.
- Call taps now create a dashboard update so the owner can see that a visitor selected a call action.
- Email action was also cleaned to use a proper `mailto:` link and dashboard activity record.

## Notes

On iPhone or Android, the call button should open the phone dialer. On desktop, it will open the system's configured phone/FaceTime/calling app if one is installed and allowed by the browser.

The phone number is still editable in Dashboard → Profile and updates the public call buttons.
