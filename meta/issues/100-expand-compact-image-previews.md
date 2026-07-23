# 100 Expand compact image previews

## Summary

Make compact notification and reply-context images easier to inspect without opening the source post.

## Requirements

- Show the full image in a floating preview near its compact thumbnail on hover.
- Offer the same preview through keyboard focus and dismiss it when hover or focus leaves.
- Keep the floating preview inside the viewport and avoid covering the source thumbnail when space permits.
- Use the original image URL for the floating preview while retaining compact preview URLs for thumbnails.
- Approximately double the vertical space available to notification image previews.
- Fit notification thumbnails within that space without cropping or distorting their aspect ratio.
- Preserve sensitive and content-warning protections so concealed images never mount or load.

## Acceptance Criteria

- Hovering or focusing a visible compact image opens a nearby floating full-image preview.
- Leaving or blurring the image closes the floating preview.
- Floating previews remain within desktop and mobile viewport bounds.
- Notification thumbnails are approximately twice their previous height and use aspect-ratio-preserving containment.
- Reply-context and notification preview interactions have Playwright coverage.
- Sensitive and content-warning compact previews do not expose image sources.

## Resolution

- Added viewport-contained floating original-image previews that open from compact thumbnails on hover or keyboard focus and close on leave, blur, or Escape.
- Kept original image URLs unmounted until interaction and immediately revoked open previews when refreshed media becomes concealed, removed, or replaced.
- Doubled notification thumbnail height, preserved image aspect ratios with containment, and made reply previews interactive without nested notification controls.
- Added Playwright coverage for pointer and keyboard interaction, viewport placement, refresh reconciliation, source privacy, thumbnail sizing, and notification navigation.
