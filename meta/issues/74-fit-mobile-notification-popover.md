# 74 Fit mobile notification popover

## Summary

Keep the header notification popover and its footer reachable on short phone viewports.

## Requirements

- Constrain the complete popover to the available dynamic viewport height.
- Keep the notification list independently scrollable.
- Keep the footer action visible and clickable.
- Preserve desktop popover sizing.

## Acceptance Criteria

- With at least 12 notification rows at 320x568, the popover bottom remains inside the viewport and its list has internal vertical overflow.
- The See all notifications action remains visible and operable.
- Scrolling the notification list changes its `scrollTop` while leaving the page `scrollY` unchanged.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
