# 78 Fit mobile image lightbox

## Summary

Make image lightboxes contain wide media and use the available phone viewport instead of reserving desktop navigation and keyboard-hint space.

## Requirements

- Keep every image fully contained within the mobile viewport and lightbox media region.
- Let landscape and portrait images use the full available mobile width when their aspect ratio permits.
- Overlay previous and next controls without reserving permanent side columns.
- Hide the desktop keyboard navigation legend on mobile while retaining direct close and multi-image controls.
- Truncate long attribution and attachment metadata without displacing the close button.
- Preserve the desktop lightbox layout and keyboard hints.

## Acceptance Criteria

- At 390px, landscape and portrait images remain inside the viewport and render at least 90% of the viewport width when aspect-ratio containment permits.
- The mobile viewer spans the lightbox width instead of retaining desktop navigation gutters.
- The close button and long metadata remain inside the header.
- Mobile does not show the arrow-key and Escape legend; desktop still does.
- Multi-image previous, next, and thumbnail controls remain operable.

## Notes

- Reported with real landscape and portrait image lightboxes after the mobile audit.
