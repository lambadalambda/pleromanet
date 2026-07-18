# 75 Make mobile navigation overlays modal

## Summary

Give the mobile drawer and details sheet correct modal focus behavior instead of leaving keyboard focus in the obscured app shell.

## Requirements

- Move focus into each overlay when it opens.
- Keep keyboard focus within the open overlay.
- Restore focus to the opener when the overlay closes.
- Expose appropriate dialog and modal semantics and prevent background interaction.

## Acceptance Criteria

- Opening either overlay moves focus to its close button or first interactive item.
- Tab and Shift+Tab remain inside each open drawer or sheet.
- Each overlay exposes dialog/modal semantics and background controls cannot receive pointer or keyboard interaction while it is open.
- Escape and explicit close restore focus to the corresponding drawer or sheet trigger.
- Existing pointer navigation and responsive behavior remain intact.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
