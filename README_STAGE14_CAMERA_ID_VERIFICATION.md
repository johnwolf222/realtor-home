# Stage 14 — Camera-only Client ID Verification

This stage tightens the Client ID Verification flow.

## What changed

- Buyer Portal verification is limited to one identification method: **Government ID**.
- Removed pre-approval letter, proof of funds, manual review, last-4/reference, and filename inputs from the identity verification form.
- The document section now requires three live camera captures:
  - Front of government ID
  - Back of government ID
  - Forward-facing face picture
- No photo-library/file-picker upload is offered in the verification UI.
- Submit button stays disabled until all three live camera photos are captured.
- The dashboard Client ID tab now shows:
  - Verification method
  - 3-photo capture count
  - Camera-only capture rule
  - Photo previews for owner review
- Verified, Pending, and Unverified client badge logic remains in place.

## Prototype note

This is still local prototype storage. The live camera restriction improves the product flow, but production identity verification should use secure backend storage, encrypted files, and ideally a real ID/KYC verification provider.
