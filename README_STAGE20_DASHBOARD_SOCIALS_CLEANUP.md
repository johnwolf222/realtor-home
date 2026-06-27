# Stage 20 — Dashboard Socials + Clean Open/Close Cards

This stage fixes the dashboard cleanup requests:

- Social media visibility now affects the public profile buttons correctly.
- Public homepage social tabs only show socials with `enabled: true` and a URL.
- Social on/off toggles in the dashboard immediately save the visibility change, so turning a social off removes it from the public site without waiting for the full profile save button.
- Legacy saved social links are normalized so older localStorage data does not break the visibility logic.
- Removed user-facing “Collapse” / “collapsed” wording from the dashboard.
- Latest dashboard updates is now closed by default and opens only when selected.
- Lead cards are closed by default and open only when selected.
- Client ID cards are closed by default and open only when selected.
- Tour request cards are closed by default and open only when selected.
- Buttons now use clean labels like `Open`, `Close`, and `Review`.

Note: this is still local browser storage. Supabase will be needed later for real cloud-backed dashboard state.
