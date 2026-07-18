# 70 Prevent mobile input focus zoom

## Summary

Prevent iOS Safari from automatically zooming the page when users focus text fields, editors, and selects across the authenticated mobile app.

## Requirements

- Keep enabled textual inputs, textareas, selects, and contenteditable textbox surfaces at a computed font size of at least 16px on phone layouts.
- Cover home composer states, inline replies, explore/search, messages, profile settings, appearance settings, emoji search, and poll controls.
- Do not disable browser pinch zoom or change viewport accessibility settings.
- Preserve existing desktop typography.

## Acceptance Criteria

- At 390px portrait, visible enabled textual controls compute to at least 16px on home composer, opened poll, opened emoji picker, opened inline reply, explore/search, chat thread, profile settings, appearance settings, and uploaded attachment states.
- At a 956x440 coarse-pointer landscape viewport, visible enabled home composer controls satisfy the same threshold.
- Existing route-specific interaction tests and responsive regressions pass.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
