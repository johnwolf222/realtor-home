# Stage 17 — Camera Permission Trigger

This stage upgrades the client ID verification camera flow so the browser camera permission is explicitly triggered through the single Open Camera button.

## Changes

- The verification flow still uses one main camera button.
- First click now clearly requests camera permission through `navigator.mediaDevices.getUserMedia()`.
- The UI now shows camera permission status:
  - Camera check
  - Permission needed
  - Camera allowed
  - Camera blocked
  - Camera unavailable
- If the browser blocks camera permission, the app shows clear recovery instructions.
- The flow checks for a secure context because camera access requires HTTPS or localhost.
- The app requests the rear camera for the ID front and back, then requests the front camera for the face picture.
- If an exact rear/front camera is unavailable, the app falls back to the browser/device's best available matching camera.
- Existing three-thumbnail capture and retake flow remains intact.

## Important production note

This is still prototype/local browser capture. Production identity verification should use encrypted storage, backend authorization, and likely a real ID verification provider.
