# 103 Share fit-images with thread view

## Summary

Expose the global Fit images preference from the thread view and keep it synchronized with the existing timeline control.

## Requirements

- Add a Fit images switch to a settings control in the thread header.
- Bind the thread and timeline switches to one shared preference and storage key.
- Apply fitted image rendering to ancestor, focused, reply, nested, mixed-media, and quoted thread images when enabled.
- Preserve cropped rendering when disabled and on unrelated post surfaces.
- Keep the thread header and settings popover accessible and responsive.

## Acceptance Criteria

- Enabling Fit images from a timeline immediately appears enabled in a subsequently opened thread and fits thread images.
- Changing Fit images from a thread is reflected when returning to timeline settings.
- Reloading either route preserves the shared value.
- The thread settings control supports keyboard activation, Escape dismissal, and focus restoration.
- Playwright coverage verifies synchronization in both directions and thread image rendering.

## Resolution

- Reused the existing settings popover in a fit-only thread-header mode with unique ARIA relationships and responsive card-contained positioning.
- Bound timeline and thread controls directly to the same reactive state, setter, local-storage key, and persisted value.
- Applied the shared fitting scope to ancestor, focused, root, nested, mixed-media, strip, and quoted thread photos.
- Added Playwright coverage for bidirectional synchronization, thread reload persistence, keyboard and Escape behavior, all thread image layouts, and 320px popover containment.
