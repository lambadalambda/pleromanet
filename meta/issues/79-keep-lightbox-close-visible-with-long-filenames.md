# 79 Keep lightbox close visible with long filenames

## Summary

Prevent unbroken attachment filenames from expanding the lightbox header and moving the close control outside the mobile viewport.

## Requirements

- Keep the lightbox header constrained to the dialog width for arbitrarily long filenames.
- Keep the close control visible, topmost, and clickable regardless of metadata length.
- Truncate filename and attribution text without introducing horizontal overflow.
- Preserve image containment, mobile navigation, and desktop lightbox behavior.

## Acceptance Criteria

- At 390px, a filename containing several hundred unbroken characters remains truncated inside the header.
- The close button rectangle stays inside the viewport and clicking it closes the lightbox.
- The lightbox and document do not horizontally overflow.
- Existing desktop and mobile lightbox tests pass.

## Notes

- Follow-up to issue 78 after a longer real-world filename still displaced the close control.
