# Stage 8 — Account Tab Cleanup

This pass cleans up the visible account/access experience.

## Changes

- Removed the duplicate `Member Access` button from auth pages.
- Renamed the main header account button to `Buyer Portal` / `Buyer Login`.
- Kept the owner dashboard hidden behind the small profile dashboard icon only.
- Made `/login` buyer-only.
- Made `/account` read as a buyer portal, not a mixed buyer/owner account area.
- Removed public wording that suggested an owner dashboard account could be managed through the buyer account area.

## Product rule

There is only one public account path: buyer access.

The owner dashboard is not a public account tab and should only be reached from the hidden dashboard icon on the profile card.
