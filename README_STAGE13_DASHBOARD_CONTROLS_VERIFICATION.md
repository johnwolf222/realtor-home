# Stage 13 — Dashboard Controls + Client Verification

This build adds owner dashboard controls requested for the realtor platform.

## New dashboard controls

### Social visibility controls
- Social links can now be turned on/off in the Dashboard > Profile tab.
- Hidden socials stay saved in the dashboard but no longer appear on the public homepage.
- Each social keeps its label, short label, and URL.

### Profile photo editing
- Dashboard > Profile now includes a profile photo editor.
- Owner can paste an image URL or upload a local image.
- Uploaded local images are stored as browser-local data URLs for the prototype.
- Public header/profile image updates immediately in this browser.

### Client ID verification workflow
- Buyer Portal includes a Client ID Verification card.
- Buyers can submit a method such as Government ID, Pre-approval letter, Proof of funds, or Manual owner review.
- Buyer status becomes Pending after submission.
- Dashboard > Client ID shows all leads and their verification status.
- Owner can mark clients Verified, Pending, or Unverified.
- Leads and chat threads show a verification badge:
  - Verified Client
  - ID Pending
  - Unverified Client

## Important prototype note
This is still localStorage-based prototype behavior. For production, client ID verification must be handled with a secure backend, encrypted storage, real authentication, and ideally a proper ID/KYC verification provider.
