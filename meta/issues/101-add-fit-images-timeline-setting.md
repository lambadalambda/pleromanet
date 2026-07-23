# 101 Add fit-images timeline setting

## Summary

Let users show complete post images in authenticated timelines instead of cropping them to fill their media frames.

## Requirements

- Add a Fit images toggle to the timeline settings popover.
- Keep the existing cropped presentation as the default.
- When enabled, fit post images within their existing timeline media frames without distorting their aspect ratios.
- Apply the preference across home, local, and federated timelines without changing non-timeline post surfaces.
- Persist the preference using the existing timeline-settings storage pattern.

## Acceptance Criteria

- The timeline settings popover exposes an accessible Fit images switch.
- Enabling the switch changes timeline post images from cropped filling to aspect-ratio-preserving containment immediately.
- Disabling the switch restores the existing cropped presentation.
- The preference survives reloads and applies across authenticated home, local, and federated timelines.
- Playwright coverage verifies the default, enabled, disabled, persisted, and cross-timeline behavior.

## Resolution

- Added an accessible Fit images switch beside the existing timeline preference and persisted it with the same local-storage pattern.
- Scoped aspect-ratio-preserving containment to standard, mixed-media, strip-thumbnail, and quoted images in authenticated home, local, and federated timeline lists.
- Preserved the existing cropped default and kept profile, bookmark, and signed-out public post images unchanged; issue 103 later extended the shared preference to threads.
- Added Playwright coverage for immediate toggling, keyboard use, reload persistence, cross-timeline reuse, alternate image layouts, and non-timeline isolation.
