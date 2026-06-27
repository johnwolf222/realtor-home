# Stage 16 — Single-button camera ID verification sequence

This stage refines the Client ID Verification experience.

## Changes

- The main Client ID Verification card remains attention-grabbing in the site navy.
- The **Verification identification method** card is white.
- The **Document file** card is white.
- Verification method is locked to **Government ID** only.
- The buyer no longer sees three separate camera cards.
- There is now one guided camera sequence with one primary camera button.
- The flow captures photos in this order:
  1. Rear camera: front of government ID
  2. Rear camera: back of the same government ID
  3. Front camera: current forward-facing face picture
- The instruction message changes after each capture.
- Three empty thumbnails are shown below/alongside the camera control.
- Each thumbnail fills as the buyer captures that step.
- Buyers can retake any captured thumbnail before submitting.
- Submit stays disabled until all 3 live captures exist.

## Prototype note

This uses browser `getUserMedia` with preferred front/rear camera constraints. Real production identity verification should use secure backend storage and a professional ID/KYC provider.
