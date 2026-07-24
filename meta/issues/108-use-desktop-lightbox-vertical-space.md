# 108 Use desktop lightbox vertical space

## Summary

Let the desktop attachment lightbox use the available viewport height instead of remaining capped at 720px on tall displays.

## Requirements

- Preserve the existing desktop horizontal inset and 1080px maximum width.
- Reduce excessive top and bottom space around the lightbox on tall viewports.
- Keep the full attachment contained within the viewer without cropping.
- Preserve the header, thumbnail strip, keyboard hints, navigation controls, and mobile full-screen layout.

## Acceptance Criteria

- At a 1440x1200 desktop viewport, the lightbox keeps a 24px outer inset at the top and bottom.
- The lightbox remains horizontally centered and no wider than 1080px.
- The image remains contained inside the media body.
- Existing desktop and mobile lightbox regressions pass.
- A focused review finds no unresolved actionable issues.
